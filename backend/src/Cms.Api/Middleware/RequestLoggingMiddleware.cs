using System.Diagnostics;
using Cms.Api.Logging;
using Cms.Application.Common.Interfaces;

namespace Cms.Api.Middleware;

/// <summary>
/// Logs each HTTP request with timing, status, and optional user/brand context. Runs after authentication so <see cref="ICurrentUser"/> is populated.
/// </summary>
public sealed class RequestLoggingMiddleware
{
    private const int MaxQueryLogLength = 512;

    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentUser currentUser)
    {
        if (ShouldSkip(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        var scopeProps = new Dictionary<string, object>();
        if (currentUser.UserId is { } uid)
        {
            scopeProps["UserId"] = uid;
        }

        var brandId = TryGetBrandIdFromRoute(context);
        if (brandId.HasValue)
        {
            scopeProps["BrandId"] = brandId.Value;
        }

        IDisposable? scope = scopeProps.Count > 0
            ? _logger.BeginScope(scopeProps)
            : null;

        try
        {
            await _next(context);
        }
        finally
        {
            scope?.Dispose();
            sw.Stop();

            var status = context.Response.StatusCode;
            var method = context.Request.Method;
            var path = context.Request.Path.Value ?? string.Empty;
            var query = TruncateQuery(context.Request.QueryString.Value);

            var correlationId = context.Items.TryGetValue(CorrelationIdConstants.ItemsKey, out var cid) && cid is string c
                ? c
                : null;

            var level = status switch
            {
                >= 500 => LogLevel.Error,
                >= 400 => LogLevel.Warning,
                _ => LogLevel.Information
            };

            _logger.Log(
                level,
                "HTTP {Method} {Path}{Query} responded {StatusCode} in {ElapsedMs} ms. CorrelationId={CorrelationId}, UserId={UserId}, BrandId={BrandId}",
                method,
                path,
                query,
                status,
                sw.ElapsedMilliseconds,
                correlationId,
                currentUser.UserId,
                brandId);
        }
    }

    private static bool ShouldSkip(PathString path)
    {
        if (path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/alive", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/dev/health", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
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

    private static Guid? TryGetBrandIdFromRoute(HttpContext context)
    {
        foreach (var key in new[] { "brandId", "BrandId" })
        {
            if (context.Request.RouteValues.TryGetValue(key, out var v)
                && v is string s
                && Guid.TryParse(s, out var g))
            {
                return g;
            }
        }

        return null;
    }
}
