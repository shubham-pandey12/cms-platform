using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.SiteSettings;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class SiteSettingsControllerTests
{
    private static SiteSettingsDto SampleSettings(Guid? id = null)
    {
        var sid = id ?? Guid.NewGuid();
        return new SiteSettingsDto(
            sid,
            Guid.NewGuid(),
            "Site",
            "Desc",
            "",
            "",
            true,
            "top",
            "bar",
            true,
            "",
            false,
            "",
            "",
            false,
            "",
            "",
            "",
            "",
            null,
            null,
            null,
            null,
            DateTime.UtcNow);
    }

    [Fact]
    public async Task GetByBrand_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<ISiteSettingsService>();
        mock.Setup(s => s.GetByBrandIdOrSlugAsync("x", It.IsAny<CancellationToken>())).ReturnsAsync((SiteSettingsDto?)null);

        var sut = new SiteSettingsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetByBrand("x", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetByBrand_WhenFound_ReturnsOk()
    {
        var dto = SampleSettings();
        var mock = new Mock<ISiteSettingsService>();
        mock.Setup(s => s.GetByBrandIdOrSlugAsync("brand", It.IsAny<CancellationToken>())).ReturnsAsync(dto);

        var sut = new SiteSettingsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetByBrand("brand", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(dto, ok.Value);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var req = new UpdateSiteSettingsRequest(
            null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null);
        var mock = new Mock<ISiteSettingsService>();
        mock.Setup(s => s.UpdateAsync(id, req, It.IsAny<CancellationToken>())).ReturnsAsync((SiteSettingsDto?)null);

        var sut = new SiteSettingsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(id, req, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenFound_ReturnsOk()
    {
        var dto = SampleSettings();
        var req = new UpdateSiteSettingsRequest(
            "N", null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null,
            null);
        var mock = new Mock<ISiteSettingsService>();
        mock.Setup(s => s.UpdateAsync(dto.Id, req, It.IsAny<CancellationToken>())).ReturnsAsync(dto);

        var sut = new SiteSettingsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(dto.Id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(dto, ok.Value);
    }
}
