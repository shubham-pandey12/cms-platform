using Cms.Domain.Enums;

namespace Cms.Application.DTOs.AuditLogs;

public sealed record AuditLogDto(
    Guid Id,
    Guid UserId,
    string Action,
    AuditEntityType EntityType,
    Guid EntityId,
    string Details,
    DateTime CreatedAt);

