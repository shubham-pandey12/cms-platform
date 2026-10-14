namespace Cms.Api.Options;

public sealed class ProxyOptions
{
    public const string SectionName = "Proxy";

    /// <summary>
    /// Allowed target hosts (lowercase). Example: ["api.example.com", "httpbin.org"]
    /// </summary>
    public List<string> AllowedHosts { get; set; } = new();

    /// <summary>
    /// Named base URLs that can be referenced by BaseUrlKey.
    /// </summary>
    public Dictionary<string, string> BaseUrls { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Server-side credential sets keyed by name.
    /// </summary>
    public Dictionary<string, ProxyCredential> Credentials { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public int DefaultTimeoutSeconds { get; set; } = 30;
    public int MaxTimeoutSeconds { get; set; } = 60;
    public int MaxResponseBytes { get; set; } = 1_000_000; // 1 MB cap by default
}

public sealed class ProxyCredential
{
    public string Type { get; set; } = "bearer"; // bearer | api_key | basic
    public string? Token { get; set; }
    public string? ApiKey { get; set; }
    public string? ApiKeyHeader { get; set; } = "Authorization";
    public string? Username { get; set; }
    public string? Password { get; set; }
}

