using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyCatalog.RolesRead)]
    public async Task<ActionResult<List<RoleDefinitionDto>>> List(CancellationToken cancellationToken)
    {
        var roles = await _roleService.ListRolesAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpGet("permissions")]
    [Authorize(Policy = PolicyCatalog.RolesRead)]
    public async Task<ActionResult<List<PermissionDefinitionDto>>> ListPermissions(CancellationToken cancellationToken)
    {
        var permissions = await _roleService.ListPermissionsAsync(cancellationToken);
        return Ok(permissions);
    }

    [HttpPost]
    [Authorize(Policy = PolicyCatalog.RolesManage)]
    public async Task<ActionResult<RoleDefinitionDto>> Create(
        [FromBody] CreateRoleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var role = await _roleService.CreateRoleAsync(request, cancellationToken);
            return Created($"/api/roles/{role.Id}", role);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{roleId:guid}")]
    [Authorize(Policy = PolicyCatalog.RolesManage)]
    public async Task<ActionResult<RoleDefinitionDto>> UpdateMetadata(
        Guid roleId,
        [FromBody] UpdateRoleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var role = await _roleService.UpdateRoleAsync(roleId, request, cancellationToken);
            return Ok(role);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{roleId:guid}")]
    [Authorize(Policy = PolicyCatalog.RolesManage)]
    public async Task<IActionResult> Delete(Guid roleId, CancellationToken cancellationToken)
    {
        try
        {
            await _roleService.DeleteRoleAsync(roleId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{roleId:guid}/permissions")]
    [Authorize(Policy = PolicyCatalog.RolesManage)]
    public async Task<ActionResult<RoleDefinitionDto>> UpdatePermissions(
        Guid roleId,
        [FromBody] UpdateRolePermissionsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var role = await _roleService.UpdateRolePermissionsAsync(roleId, request, cancellationToken);
            return Ok(role);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

