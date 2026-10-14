using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/users/{userId:guid}/assignments")]
public sealed class UserAssignmentsController : ControllerBase
{
    private readonly IUserAssignmentService _userAssignmentService;

    public UserAssignmentsController(IUserAssignmentService userAssignmentService)
    {
        _userAssignmentService = userAssignmentService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyCatalog.UsersRead)]
    public async Task<ActionResult<UserAssignmentsResponseDto>> Get(Guid userId, CancellationToken cancellationToken)
    {
        var response = await _userAssignmentService.GetUserAssignmentsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPut]
    [Authorize(Policy = PolicyCatalog.UsersManage)]
    public async Task<ActionResult<UserAssignmentsResponseDto>> Put(
        Guid userId,
        [FromBody] UpdateUserAssignmentsRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _userAssignmentService.UpdateUserAssignmentsAsync(userId, request, cancellationToken);
        return Ok(response);
    }
}

