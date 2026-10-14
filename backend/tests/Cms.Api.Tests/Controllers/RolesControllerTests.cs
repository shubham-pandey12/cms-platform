using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class RolesControllerTests
{
    [Fact]
    public async Task WhenListCalledThenReturnsOkWithRoles()
    {
        var roles = new List<RoleDefinitionDto>
        {
            new(Guid.NewGuid(), "admin", "Admin", "Full access", true, [])
        };
        var service = new Mock<IRoleService>();
        service.Setup(x => x.ListRolesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(roles);

        var sut = new RolesController(service.Object);
        var result = await sut.List(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(roles, ok.Value);
    }

    [Fact]
    public async Task WhenUpdatePermissionsCalledThenReturnsOkWithUpdatedRole()
    {
        var roleId = Guid.NewGuid();
        var request = new UpdateRolePermissionsRequest(["users.read"]);
        var response = new RoleDefinitionDto(roleId, "admin", "Admin", "Full access", true, []);
        var service = new Mock<IRoleService>();
        service.Setup(x => x.UpdateRolePermissionsAsync(roleId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var sut = new RolesController(service.Object);
        var result = await sut.UpdatePermissions(roleId, request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task WhenDeleteRoleHasAssignmentsThenReturnsConflict()
    {
        var roleId = Guid.NewGuid();
        var service = new Mock<IRoleService>();
        service.Setup(x => x.DeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Cannot delete a role that still has user assignments."));

        var sut = new RolesController(service.Object);
        var result = await sut.Delete(roleId, CancellationToken.None);

        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.NotNull(conflict.Value);
    }

    [Fact]
    public async Task WhenDeleteRoleNotFoundThenReturnsNotFound()
    {
        var roleId = Guid.NewGuid();
        var service = new Mock<IRoleService>();
        service.Setup(x => x.DeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException("RBAC role not found."));

        var sut = new RolesController(service.Object);
        var result = await sut.Delete(roleId, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task WhenDeleteSucceedsThenReturnsNoContent()
    {
        var roleId = Guid.NewGuid();
        var service = new Mock<IRoleService>();
        service.Setup(x => x.DeleteRoleAsync(roleId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var sut = new RolesController(service.Object);
        var result = await sut.Delete(roleId, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }
}

