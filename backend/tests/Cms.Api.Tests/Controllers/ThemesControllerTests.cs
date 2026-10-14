using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Themes.Requests;
using Cms.Application.DTOs.Themes.Responses;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class ThemesControllerTests
{
    private static ThemeDto SampleTheme(Guid? id = null)
    {
        var tid = id ?? Guid.NewGuid();
        var colors = new ThemeColorsDto("#1", "#2", "#3", "#4", "#5");
        var fonts = new ThemeFontsDto("h", "b");
        return new ThemeDto(tid, "T", colors, fonts, null, null, false, null);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var list = new List<ThemeDto> { SampleTheme() };
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((ThemeDto?)null);

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var theme = SampleTheme();
        var colors = new ThemeColorsDto("#1", "#2", "#3", "#4", "#5");
        var fonts = new ThemeFontsDto("h", "b");
        var req = new CreateThemeRequest("T", colors, fonts, null, null, null);
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.CreateAsync(req, It.IsAny<CancellationToken>())).ReturnsAsync(theme);

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Create(req, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(ThemesController.GetById), created.ActionName);
        Assert.Equal(theme.Id, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task Delete_WhenDeleted_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_WhenNotDeleted_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(id, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenDefaultThemeConflict_ReturnsBadRequest()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IThemeService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("Cannot remove default theme for brand"));

        var sut = new ThemesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(id, CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(bad.Value);
    }
}
