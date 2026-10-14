using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for Brand entity.
/// </summary>
public class BrandRepository : Repository<Brand>, IBrandRepository
{
    public BrandRepository(CmsDbContext context) : base(context)
    {
    }

    public async Task<Brand?> GetBySubdomainAsync(string subdomain, CancellationToken cancellationToken = default)
    {
        var normalizedSlug = subdomain.ToLower();
        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Subdomain != null && b.Subdomain.ToLower() == normalizedSlug, cancellationToken);
    }

    public async Task<Brand?> GetByDomainAsync(string domain, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(domain)) return null;
        var normalized = domain.Trim().ToLower();
        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Domain.ToLower() == normalized, cancellationToken);
    }

    public async Task<Brand?> GetByHostAsync(string host, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(host)) return null;
        var normalized = host.Trim().ToLower();
        var hostWithoutPort = normalized.Contains(':') ? normalized.Split(':')[0] : normalized;

        var byDomain = await GetByDomainAsync(hostWithoutPort, cancellationToken);
        if (byDomain is not null)
            return byDomain;

        var brandDomain = await Context.BrandDomains
            .AsNoTracking()
            .FirstOrDefaultAsync(bd => bd.Domain.ToLower() == hostWithoutPort, cancellationToken);
        if (brandDomain is null)
            return null;

        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == brandDomain.BrandId, cancellationToken);
    }

    public async Task<List<Guid>> GetAllBrandIdsAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Select(b => b.Id)
            .ToListAsync(cancellationToken);
    }
}

