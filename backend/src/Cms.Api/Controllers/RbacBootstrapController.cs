using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Api.Controllers;

/// <summary>
/// Emergency RBAC bootstrap endpoint for non-production recovery.
/// </summary>
[ApiController]
[Route("api/dev/rbac/bootstrap-admin")]
[ApiExplorerSettings(IgnoreApi = true)]
public sealed class RbacBootstrapController : ControllerBase
{
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IRbacRepository _rbacRepository;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<RbacBootstrapController> _logger;

    public RbacBootstrapController(
        IHostEnvironment environment,
        IConfiguration configuration,
        IRbacRepository rbacRepository,
        UserManager<ApplicationUser> userManager,
        ILogger<RbacBootstrapController> logger)
    {
        _environment = environment;
        _configuration = configuration;
        _rbacRepository = rbacRepository;
        _userManager = userManager;
        _logger = logger;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Bootstrap([FromQuery] string email, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("email is required.");
        }

        var secret = _configuration["Rbac:BootstrapSecret"];
        var providedSecret = Request.Headers["X-Rbac-Bootstrap-Secret"].FirstOrDefault();
        // Secret is required in every environment — Development is not exempt.
        if (string.IsNullOrWhiteSpace(secret) || !string.Equals(secret, providedSecret, StringComparison.Ordinal))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user is null)
        {
            return NotFound("User not found.");
        }

        var roles = await _rbacRepository.GetRolesWithPermissionsAsync(cancellationToken);
        var adminRole = roles.FirstOrDefault(x => x.Key == RoleCatalog.Admin);
        if (adminRole is null)
        {
            return BadRequest("Admin RBAC role does not exist.");
        }

        var assignments = await _rbacRepository.GetUserAssignmentsAsync(user.Id, cancellationToken);
        var alreadyAssigned = assignments.Any(x =>
            x.RoleDefinitionId == adminRole.Id &&
            x.ScopeType == AssignmentScopeType.Organization &&
            x.ScopeId == null);

        if (!alreadyAssigned)
        {
            assignments.Add(new UserRoleAssignment
            {
                UserId = user.Id,
                RoleDefinitionId = adminRole.Id,
                ScopeType = AssignmentScopeType.Organization
            });
            await _rbacRepository.ReplaceUserAssignmentsAsync(user.Id, assignments, cancellationToken);
            await _rbacRepository.SaveChangesAsync(cancellationToken);
        }

        _logger.LogWarning(
            "Emergency RBAC bootstrap executed. UserId={UserId}, Email={Email}, Environment={Environment}, RemoteIp={RemoteIp}",
            user.Id,
            user.Email,
            _environment.EnvironmentName,
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = "Bootstrap admin assignment ensured." });
    }
}

