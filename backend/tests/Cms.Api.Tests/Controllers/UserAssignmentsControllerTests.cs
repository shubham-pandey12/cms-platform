using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class UserAssignmentsControllerTests
{
    [Fact]
    public async Task WhenGetCalledWithValidUserIdThenReturnsOk()
    {
        var userId = Guid.NewGuid();
        var response = new UserAssignmentsResponseDto(
            userId,
            [],
            new EffectivePermissionsDto([], []));

        var service = new Mock<IUserAssignmentService>();
        service.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var sut = new UserAssignmentsController(service.Object);
        var result = await sut.Get(userId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task WhenPutCalledWithValidRequestThenReturnsOk()
    {
        var userId = Guid.NewGuid();
        var request = new UpdateUserAssignmentsRequest([]);
        var response = new UserAssignmentsResponseDto(
            userId,
            [],
            new EffectivePermissionsDto([], []));

        var service = new Mock<IUserAssignmentService>();
        service.Setup(x => x.UpdateUserAssignmentsAsync(userId, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var sut = new UserAssignmentsController(service.Object);
        var result = await sut.Put(userId, request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }
}

