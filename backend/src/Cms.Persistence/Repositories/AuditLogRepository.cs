using Microsoft.EntityFrameworkCore;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for AuditLog entity.
/// </summary>
public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly CmsDbContext _context;

    public AuditLogRepository(CmsDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<List<AuditLog>> GetAsync(Guid? entityId, AuditEntityType? entityType, int limit, int offset, CancellationToken cancellationToken = default)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (entityId.HasValue)
        {
            query = query.Where(l => l.EntityId == entityId.Value);
        }

        if (entityType.HasValue)
        {
            query = query.Where(l => l.EntityType == entityType.Value);
        }

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}
