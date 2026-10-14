using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Users;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class UsersControllerTests
{
    private static ListUserDto SampleUser(Guid? id = null)
    {
        var uid = id ?? Guid.NewGuid();
        return new ListUserDto(uid, "a@b.com", "N", "Admin", [], DateTime.UtcNow);
    }

    [Fact]
    public async Task List_ReturnsOkWithUsers()
    {
        var users = new List<ListUserDto> { SampleUser() };
        var mock = new Mock<IUserService>();
        mock.Setup(s => s.ListUsersAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var sut = new UsersController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.List(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(users, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IUserService>();
        mock.Setup(s => s.GetUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((ListUserDto?)null);

        var sut = new UsersController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var u = SampleUser();
        var mock = new Mock<IUserService>();
        mock.Setup(s => s.GetUserAsync(u.Id, It.IsAny<CancellationToken>())).ReturnsAsync(u);

        var sut = new UsersController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(u.Id, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(u, ok.Value);
    }

    [Fact]
    public async Task Update_ReturnsOkWithUser()
    {
        var id = Guid.NewGuid();
        var u = SampleUser(id);
        var req = new UpdateUserRequest("X", "Admin", []);
        var mock = new Mock<IUserService>();
        mock.Setup(s => s.UpdateUserAsync(id, req, It.IsAny<CancellationToken>())).ReturnsAsync(u);

        var sut = new UsersController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(u, ok.Value);
    }
}
