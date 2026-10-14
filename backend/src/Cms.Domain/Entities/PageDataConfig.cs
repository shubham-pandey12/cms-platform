namespace Cms.Domain.Entities;

/// <summary>
/// Configuration for page data including variables and API calls.
/// </summary>
public sealed class PageDataConfig
{
    public Guid Id { get; set; }
    public Guid PageId { get; set; }

    /// <summary>
    /// Page variables stored as JSON (PageVariable[]).
    /// </summary>
    public string Variables { get; set; } = "[]";

    /// <summary>
    /// API call configurations stored as JSON (ApiCall[]).
    /// </summary>
    public string ApiCalls { get; set; } = "[]";

    // Navigation properties
    public Page Page { get; set; } = null!;
}

