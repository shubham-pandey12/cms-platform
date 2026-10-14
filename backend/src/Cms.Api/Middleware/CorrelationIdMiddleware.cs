using System.Diagnostics;
using Cms.Api.Logging;

namespace Cms.Api.Middleware;

/// <summary>
/// Adds a correlation ID to the request and response for tracing. Uses X-Correlation-Id header when present;
/// otherwise uses the current OpenTelemetry trace id when available, or generates a new id.
/// </summary>
public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ILogger<CorrelationIdMiddleware> logger)
    {
        string correlationId;
        if (context.Request.Headers.TryGetValue(CorrelationIdConstants.HeaderName, out var headerValues))
        {
            var fromHeader = headerValues.FirstOrDefault();
            correlationId = string.IsNullOrWhiteSpace(fromHeader)
                ? NewCorrelationIdFromActivityOrGuid()
                : fromHeader.Trim();
        }
        else
        {
            correlationId = NewCorrelationIdFromActivityOrGuid();
        }

        context.Response.Headers[CorrelationIdConstants.HeaderName] = correlationId;
        context.Items[CorrelationIdConstants.ItemsKey] = correlationId;

        using (logger.BeginScope(new Dictionary<string, object> { [CorrelationIdConstants.ItemsKey] = correlationId }))
        {
            await _next(context);
        }
    }

    private static string NewCorrelationIdFromActivityOrGuid()
    {
        var activity = Activity.Current;
        if (activity is not null && activity.TraceId != default)
        {
            return activity.TraceId.ToString();
        }

        return Guid.NewGuid().ToString("N");
    }
}
