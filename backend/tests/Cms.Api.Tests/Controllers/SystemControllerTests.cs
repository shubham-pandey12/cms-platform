using Microsoft.AspNetCore.Mvc;
using Cms.Api.Controllers;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class SystemControllerTests
{
    [Fact]
    public void GetConfig_ReturnsOkWithCategoriesAndSpacing()
    {
        var sut = new SystemController { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = sut.GetConfig();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var config = Assert.IsType<SystemConfigResponse>(ok.Value);
        Assert.Equal(5, config.WidgetCategories.Count);
        Assert.Equal("32px", config.Spacing.Padding["md"]);
    }
}
