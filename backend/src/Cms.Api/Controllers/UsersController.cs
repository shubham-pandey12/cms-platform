using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Users;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

/// <summary>
/// Admin API for listing and updating users (roles, brand access).
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Gets all users (admin only).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = PolicyCatalog.UsersRead)]
    public async Task<ActionResult<List<ListUserDto>>> List(CancellationToken cancellationToken)
    {
        var users = await _userService.ListUsersAsync(cancellationToken);
        return Ok(users);
    }

    /// <summary>
    /// Gets a user by ID (admin only).
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.UsersRead)]
    public async Task<ActionResult<ListUserDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var user = await _userService.GetUserAsync(id, cancellationToken);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>
    /// Updates a user's name, role, and brand access (admin only).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyCatalog.UsersManage)]
    public async Task<ActionResult<ListUserDto>> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await _userService.UpdateUserAsync(id, request, cancellationToken);
        return Ok(user);
    }
}
