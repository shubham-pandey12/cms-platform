namespace Cms.Api.Logging;

/// <summary>
/// Shared keys for correlation ID in headers, response, and <see cref="Microsoft.AspNetCore.Http.HttpContext.Items"/>.
/// </summary>
public static class CorrelationIdConstants
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemsKey = "CorrelationId";
}
