using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.MockData;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class MockDataControllerTests
{
    [Fact]
    public async Task GetGalleryImages_ReturnsOk()
    {
        var response = new GalleryResponse([], 0, false);
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetGalleryImagesAsync(12, 0, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetGalleryImages(12, 0, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task GetFeaturedDestinations_ReturnsOk()
    {
        var response = new DestinationsResponse([], 0, false);
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetFeaturedDestinationsAsync(8, 0, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFeaturedDestinations(8, 0, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task GetDestinations_ReturnsOkWithAnonymousPayload()
    {
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetDestinationsAsync(false, 10, It.IsAny<CancellationToken>())).ReturnsAsync(new List<SimpleDestinationDto>());

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetDestinations(false, 10, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetFaqItems_ReturnsOk()
    {
        var response = new FaqResponse([]);
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetFaqItemsAsync(It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFaqItems(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task GetFeaturedPackages_ReturnsOk()
    {
        var response = new PackagesResponse([]);
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetFeaturedPackagesAsync(6, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFeaturedPackages(6, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }

    [Fact]
    public async Task GetPackages_ReturnsOk()
    {
        var response = new PackagesResponse([]);
        var mock = new Mock<IMockDataService>();
        mock.Setup(s => s.GetPackagesAsync(12, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new MockDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetPackages(12, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }
}
