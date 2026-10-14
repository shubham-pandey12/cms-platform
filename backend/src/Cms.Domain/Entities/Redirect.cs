using Cms.Domain.Enums;

namespace Cms.Domain.Entities;

/// <summary>
/// Represents a URL redirect rule.
/// </summary>
public sealed class Redirect
{
    public Guid Id { get; set; }
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public Guid BrandId { get; set; }
    public RedirectStatus Status { get; set; } = RedirectStatus.MovedPermanently;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public Brand Brand { get; set; } = null!;
}

