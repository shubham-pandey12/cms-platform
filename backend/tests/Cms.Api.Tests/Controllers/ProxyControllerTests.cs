using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;
using Cms.Api.Controllers;
using Cms.Api.Models.Proxy;
using Cms.Api.Services.Proxy;
using ProxyOptions = Cms.Api.Options.ProxyOptions;
using ProxyCredential = Cms.Api.Options.ProxyCredential;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class ProxyControllerTests
{
    [Fact]
    public async Task Execute_ReturnsStatusFromService()
    {
        var body = new ProxyRequestDto { Endpoint = "/x", Method = "GET" };
        var proxyResult = new ProxyResponseDto { StatusCode = 201, Data = new { a = 1 } };
        var mock = new Mock<IProxyService>();
        mock.Setup(s => s.ExecuteAsync(body, It.IsAny<CancellationToken>())).ReturnsAsync(proxyResult);

        var options = Microsoft.Extensions.Options.Options.Create(new ProxyOptions());
        var sut = new ProxyController(mock.Object, options) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Execute(body, CancellationToken.None);

        var obj = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(201, obj.StatusCode);
        Assert.Same(proxyResult, obj.Value);
    }

    [Fact]
    public void GetConfig_ReturnsOkWithOptionKeys()
    {
        var opt = new ProxyOptions
        {
            AllowedHosts = ["a.com"],
            BaseUrls = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["api"] = "https://api" },
            Credentials = new Dictionary<string, ProxyCredential>(StringComparer.OrdinalIgnoreCase) { ["c"] = new ProxyCredential() },
        };
        var mock = new Mock<IProxyService>();
        var sut = new ProxyController(mock.Object, Microsoft.Extensions.Options.Options.Create(opt)) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };

        var result = sut.GetConfig();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }
}
