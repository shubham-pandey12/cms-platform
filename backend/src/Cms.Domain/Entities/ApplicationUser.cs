using Microsoft.AspNetCore.Identity;

namespace Cms.Domain.Entities;

/// <summary>
/// Application user extending ASP.NET Identity with CMS-specific properties.
/// </summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public List<Guid> BrandIds { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

