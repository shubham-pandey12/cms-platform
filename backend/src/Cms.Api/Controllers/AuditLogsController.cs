using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.AuditLogs;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize]
public sealed class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;

    public AuditLogsController(IAuditLogService auditLogService)
    {
        _auditLogService = auditLogService;
    }

    /// <summary>
    /// Gets audit logs with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AuditLogDto>>> GetAll(
        [FromQuery] Guid? entityId,
        [FromQuery] AuditEntityType? entityType,
        [FromQuery] int limit = 50,
        [FromQuery] int offset = 0,
        CancellationToken cancellationToken = default)
    {
        var logs = await _auditLogService.GetAllAsync(entityId, entityType, limit, offset, cancellationToken);
        return Ok(logs);
    }
}
