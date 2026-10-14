using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text.Json;
using FluentValidation;
using Cms.Api.Logging;

namespace Cms.Api.Middleware;

/// <summary>
/// Global exception handling middleware that catches and handles exceptions across the application.
/// Maps known exception types to appropriate HTTP status codes.
/// </summary>
public sealed class GlobalExceptionHandlerMiddleware
{
    private const int MaxQueryLogLength = 512;

    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug(
                "Request was canceled by the client. Path={Path}, Method={Method}, CorrelationId={CorrelationId}, UserId={UserId}, Query={Query}",
                context.Request.Path,
                context.Request.Method,
                GetCorrelationId(context),
                GetUserId(context),
                TruncateQuery(context.Request.QueryString.Value));
            return;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation(
                "Request operation timed out or was canceled. Path={Path}, Method={Method}, CorrelationId={CorrelationId}, UserId={UserId}, Query={Query}",
                context.Request.Path,
                context.Request.Method,
                GetCorrelationId(context),
                GetUserId(context),
                TruncateQuery(context.Request.QueryString.Value));

            if (!context.Response.HasStarted)
            {
                await HandleCancellationAsync(context);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "An unhandled exception occurred. Path={Path}, Method={Method}, CorrelationId={CorrelationId}, UserId={UserId}, Query={Query}",
                context.Request.Path,
                context.Request.Method,
                GetCorrelationId(context),
                GetUserId(context),
                TruncateQuery(context.Request.QueryString.Value));

            if (!context.Response.HasStarted)
            {
                await HandleExceptionAsync(context, ex);
            }
        }
    }

    private static async Task HandleCancellationAsync(HttpContext context)
    {
        context.Response.StatusCode = (int)HttpStatusCode.RequestTimeout; // 408
        context.Response.ContentType = "application/json";
        if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
        {
            context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        }

        var correlationId = GetCorrelationId(context);
        var response = new
        {
            message = "The request was canceled or timed out.",
            statusCode = context.Response.StatusCode,
            correlationId
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message) = MapExceptionToStatus(exception);
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";
        if (!context.Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
        {
            context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        }

        var correlationId = GetCorrelationId(context);
        object response;
        if (_environment.IsDevelopment())
        {
            response = new
            {
                message,
                statusCode = context.Response.StatusCode,
                correlationId,
                detail = exception.ToString()
            };
        }
        else
        {
            response = new
            {
                message,
                statusCode = context.Response.StatusCode,
                correlationId
            };
        }

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }

    private static string? GetCorrelationId(HttpContext context)
    {
        return context.Items.TryGetValue(CorrelationIdConstants.ItemsKey, out var v) && v is string s ? s : null;
    }

    private static string? GetUserId(HttpContext context)
    {
        return context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private static string TruncateQuery(string? query)
    {
        if (string.IsNullOrEmpty(query))
        {
            return string.Empty;
        }

        return query.Length <= MaxQueryLogLength
            ? query
            : query[..MaxQueryLogLength] + "…";
    }

    private static (HttpStatusCode statusCode, string message) MapExceptionToStatus(Exception exception)
    {
        return exception switch
        {
            KeyNotFoundException keyEx => (HttpStatusCode.NotFound, keyEx.Message),
            // UnauthorizedAccessException signals "access denied" (HTTP 403 Forbidden).
            // For unauthenticated callers (HTTP 401) the JWT middleware returns 401 before reaching controllers.
            // Auth endpoints (login/register) that need a 401 on bad credentials catch the exception themselves.
            UnauthorizedAccessException unauthEx => (HttpStatusCode.Forbidden, unauthEx.Message),
            ArgumentException argEx => (HttpStatusCode.BadRequest, argEx.Message),
            InvalidOperationException invEx => (HttpStatusCode.BadRequest, invEx.Message),
            ValidationException valEx => (
                HttpStatusCode.BadRequest,
                valEx.Errors.Any() ? valEx.Errors.First().ErrorMessage : valEx.Message),
            _ => (HttpStatusCode.InternalServerError, "An error occurred while processing your request.")
        };
    }
}
