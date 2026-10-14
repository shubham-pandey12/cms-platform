using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.PageData;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class PageDataControllerTests
{
    [Fact]
    public async Task GetByPageId_ReturnsOk()
    {
        var pageId = Guid.NewGuid();
        var response = new PageDataResponse([], []);
        var mock = new Mock<IPageDataService>();
        mock.Setup(s => s.GetByPageIdAsync(pageId, It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var sut = new PageDataController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetByPageId(pageId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, ok.Value);
    }
}
