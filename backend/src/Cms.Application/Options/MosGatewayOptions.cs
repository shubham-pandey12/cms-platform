namespace Cms.Application.Options;

/// <summary>
/// Configuration for MOS Gateway OAuth 2.0 integration.
/// </summary>
public sealed class MosGatewayOptions
{
    public const string SectionName = "MosGateway";

    /// <summary>
    /// MOS Gateway base URL (e.g. https://example.com). No trailing slash.
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// OAuth client ID registered with MOS Gateway.
    /// </summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>
    /// OAuth client secret. Do not commit; use environment or user secrets.
    /// </summary>
    public string ClientSecret { get; set; } = string.Empty;

    /// <summary>
    /// Allowed redirect URIs for the OAuth callback. Backend validates that the request's redirect_uri is in this list.
    /// </summary>
    public List<string> AllowedRedirectUris { get; set; } = new();

    /// <summary>
    /// Path for whoami (relative to BaseUrl). Matches Gateway GET /oauth/whoami when set to "oauth/whoami". If empty, user is read from id_token claims only.
    /// </summary>
    public string UserInfoPath { get; set; } = "oauth/whoami";

    /// <summary>
    /// Timeout in seconds for HTTP calls to MOS Gateway (token exchange, whoami). Use 60+ in UAT/cloud if VPC egress is slow; too low causes TaskCanceledException mapped to 408 by the API.
    /// </summary>
    public int TimeoutSeconds { get; set; } = 60;
}
