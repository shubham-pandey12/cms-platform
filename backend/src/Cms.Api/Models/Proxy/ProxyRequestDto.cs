using System.ComponentModel.DataAnnotations;

namespace Cms.Api.Models.Proxy;

public sealed class ProxyRequestDto
{
    [Required]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    public string Method { get; set; } = "GET";

    /// <summary>
    /// Optional key referencing a base URL from configuration.
    /// </summary>
    public string? BaseUrlKey { get; set; }

    /// <summary>
    /// Optional credential key referencing configured server-side credentials.
    /// </summary>
    public string? CredentialKey { get; set; }

    public Dictionary<string, string>? Headers { get; set; }

    public Dictionary<string, string>? Query { get; set; }

    public string? Body { get; set; }

    /// <summary>
    /// Timeout in milliseconds (optional). Will be capped by server defaults.
    /// </summary>
    public int? TimeoutMs { get; set; }
}

