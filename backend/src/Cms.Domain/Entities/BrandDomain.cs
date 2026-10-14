namespace Cms.Domain.Entities;

/// <summary>
/// Represents a domain that belongs to a brand. A brand can have multiple domains (e.g. apex and www).
/// </summary>
public sealed class BrandDomain
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Domain { get; set; } = string.Empty;

    public Brand Brand { get; set; } = null!;
}
