using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Widgets.Responses;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class WidgetsControllerTests
{
    private static WidgetDefinitionDto SampleDefinition(Guid? id = null)
    {
        var wid = id ?? Guid.NewGuid();
        var now = DateTime.UtcNow;
        return new WidgetDefinitionDto(
            wid,
            "hero",
            "Hero",
            WidgetCategory.Content,
            "d",
            "i",
            "1.0.0",
            null,
            "{}",
            "{}",
            null,
            [],
            false,
            false,
            now,
            now);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithWidgets()
    {
        var brandId = Guid.NewGuid();
        var list = new List<WidgetDefinitionDto> { SampleDefinition() };
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetAllAsync(brandId, It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(brandId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((WidgetDefinitionDto?)null);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var w = SampleDefinition();
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetByIdAsync(w.Id, It.IsAny<CancellationToken>())).ReturnsAsync(w);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(w.Id, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(w, ok.Value);
    }

    [Fact]
    public async Task GetVersions_ReturnsOk()
    {
        var items = new List<WidgetVersionListItemDto>();
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetVersionsAsync("hero", It.IsAny<CancellationToken>())).ReturnsAsync(items);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetVersions("hero", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(items, ok.Value);
    }

    [Fact]
    public async Task GetVersion_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetBySlugAndVersionAsync("x", "1", It.IsAny<CancellationToken>())).ReturnsAsync((WidgetVersionDto?)null);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetVersion("x", "1", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetVersion_WhenFound_ReturnsOk()
    {
        var v = new WidgetVersionDto(
            Guid.NewGuid(),
            "hero",
            "1",
            "Hero",
            "d",
            "{}",
            "{}",
            null,
            null,
            true,
            false,
            DateTime.UtcNow);
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetBySlugAndVersionAsync("hero", "1", It.IsAny<CancellationToken>())).ReturnsAsync(v);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetVersion("hero", "1", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(v, ok.Value);
    }

    [Fact]
    public async Task GetAllVersions_ReturnsOk()
    {
        var list = new List<WidgetVersionDto>();
        var mock = new Mock<IWidgetService>();
        mock.Setup(s => s.GetAllVersionsAsync("hero", It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new WidgetsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAllVersions("hero", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }
}
