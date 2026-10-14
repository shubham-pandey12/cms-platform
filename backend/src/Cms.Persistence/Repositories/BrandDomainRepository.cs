using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for BrandDomain entity.
/// </summary>
public sealed class BrandDomainRepository : IBrandDomainRepository
{
    private readonly CmsDbContext _context;

    public BrandDomainRepository(CmsDbContext context)
    {
        _context = context;
    }

    public async Task<List<BrandDomain>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await _context.BrandDomains
            .AsNoTracking()
            .Where(bd => bd.BrandId == brandId)
            .OrderBy(bd => bd.Domain)
            .ToListAsync(cancellationToken);
    }

    public async Task<BrandDomain?> GetByDomainAsync(string domain, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(domain)) return null;
        var normalized = domain.Trim().ToLower();
        return await _context.BrandDomains
            .AsNoTracking()
            .FirstOrDefaultAsync(bd => bd.Domain.ToLower() == normalized, cancellationToken);
    }

    public async Task<BrandDomain> AddAsync(BrandDomain entity, CancellationToken cancellationToken = default)
    {
        await _context.BrandDomains.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task DeleteAsync(BrandDomain entity, CancellationToken cancellationToken = default)
    {
        _context.BrandDomains.Remove(entity);
        return Task.CompletedTask;
    }
}
