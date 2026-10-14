using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Api.Tests.TestHelpers;
using Cms.Application.DTOs.SiteLayouts.Requests;
using Cms.Application.DTOs.SiteLayouts.Responses;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class SiteLayoutsControllerTests
{
    private static SiteLayoutDto SampleLayout(Guid? id = null)
    {
        var lid = id ?? Guid.NewGuid();
        var now = DateTime.UtcNow;
        return new SiteLayoutDto(
            lid,
            Guid.NewGuid(),
            "Main",
            false,
            "<header/>",
            "<footer/>",
            null,
            now,
            now,
            Guid.NewGuid(),
            Guid.NewGuid());
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var list = new List<SiteLayoutDto> { SampleLayout() };
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new SiteLayoutsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((SiteLayoutDto?)null);

        var sut = new SiteLayoutsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var userId = Guid.NewGuid();
        var layout = SampleLayout();
        var req = new CreateSiteLayoutRequest(Guid.NewGuid(), "L", "<h/>", "<f/>", null, false);
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.CreateAsync(req, userId, It.IsAny<CancellationToken>())).ReturnsAsync(layout);

        var sut = new SiteLayoutsController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Create(req, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(SiteLayoutsController.GetById), created.ActionName);
        Assert.Equal(layout.Id, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound()
    {
        var userId = Guid.NewGuid();
        var req = new UpdateSiteLayoutRequest(null, null, null, null, null);
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.UpdateAsync(It.IsAny<Guid>(), req, userId, It.IsAny<CancellationToken>())).ReturnsAsync((SiteLayoutDto?)null);

        var sut = new SiteLayoutsController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Update(Guid.NewGuid(), req, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenFound_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var layout = SampleLayout();
        var req = new UpdateSiteLayoutRequest("X", null, null, null, null);
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.UpdateAsync(layout.Id, req, userId, It.IsAny<CancellationToken>())).ReturnsAsync(layout);

        var sut = new SiteLayoutsController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Update(layout.Id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(layout, ok.Value);
    }

    [Fact]
    public async Task Delete_WhenNotDeleted_ReturnsNotFound()
    {
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.DeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new SiteLayoutsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenDeleted_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<ISiteLayoutService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new SiteLayoutsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }
}
