using Microsoft.AspNetCore.Http;
using Serilog.Core;
using Serilog.Events;

namespace Cms.Api.Logging;

/// <summary>
/// Adds CorrelationId from <see cref="HttpContext.Items"/> to every Serilog event (for sinks that do not use only Microsoft logging scopes).
/// </summary>
public sealed class HttpContextCorrelationIdEnricher : ILogEventEnricher
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpContextCorrelationIdEnricher(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var http = _httpContextAccessor.HttpContext;
        if (http?.Items.TryGetValue(CorrelationIdConstants.ItemsKey, out var value) == true
            && value is string correlationId
            && !string.IsNullOrEmpty(correlationId))
        {
            logEvent.AddPropertyIfAbsent(propertyFactory.CreateProperty("CorrelationId", correlationId));
        }
    }
}
