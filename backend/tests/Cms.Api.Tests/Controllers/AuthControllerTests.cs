using System.Net;
using System.Net.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Moq.Protected;
using Cms.Api.Controllers;
using Cms.Application.Common.Interfaces;
using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.DTOs.Auth.Responses;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class AuthControllerTests
{
    private static AuthResponse SampleAuthResponse()
    {
        var user = new UserDto(Guid.NewGuid(), "a@b.com", "N", "Admin", [], ["Admin"]);
        return new AuthResponse("token", "refresh", DateTime.UtcNow.AddHours(1), user);
    }

    [Fact]
    public async Task Login_ReturnsOk()
    {
        var auth = SampleAuthResponse();
        var req = new LoginRequest("a@b.com", "x");
        var mock = new Mock<IAuthService>();
        mock.Setup(s => s.LoginAsync(req, It.IsAny<CancellationToken>())).ReturnsAsync(auth);
        var cur = new Mock<ICurrentUser>();
        var factory = new Mock<IHttpClientFactory>();

        var sut = new AuthController(mock.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.Login(req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(auth, ok.Value);
    }

    [Fact]
    public async Task Register_ReturnsOk()
    {
        var auth = SampleAuthResponse();
        var req = new RegisterRequest("a@b.com", "p", "N");
        var mock = new Mock<IAuthService>();
        mock.Setup(s => s.RegisterAsync(req, It.IsAny<CancellationToken>())).ReturnsAsync(auth);
        var cur = new Mock<ICurrentUser>();
        var factory = new Mock<IHttpClientFactory>();

        var sut = new AuthController(mock.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.Register(req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(auth, ok.Value);
    }

    [Fact]
    public async Task MosCallback_ReturnsOk()
    {
        var auth = SampleAuthResponse();
        var req = new MosCallbackRequest("code", "https://cb");
        var mock = new Mock<IAuthService>();
        mock.Setup(s => s.LoginWithMosCallbackAsync(req, It.IsAny<CancellationToken>())).ReturnsAsync(auth);
        var cur = new Mock<ICurrentUser>();
        var factory = new Mock<IHttpClientFactory>();

        var sut = new AuthController(mock.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.MosCallback(req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(auth, ok.Value);
    }

    [Fact]
    public async Task GetCurrentUser_WhenNoUserId_ReturnsUnauthorized()
    {
        var mock = new Mock<IAuthService>();
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns((Guid?)null);
        var factory = new Mock<IHttpClientFactory>();

        var sut = new AuthController(mock.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.GetCurrentUser(CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result.Result);
        mock.Verify(s => s.GetCurrentUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetCurrentUser_WhenUserIdPresent_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var userDto = SampleAuthResponse().User;
        var mock = new Mock<IAuthService>();
        mock.Setup(s => s.GetCurrentUserAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(userDto);
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var factory = new Mock<IHttpClientFactory>();

        var sut = new AuthController(mock.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.GetCurrentUser(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(userDto, ok.Value);
    }

    [Fact]
    public async Task PingExternal_WhenSuccess_ReturnsOkPayload()
    {
        var mockAuth = new Mock<IAuthService>();
        var cur = new Mock<ICurrentUser>();

        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage(HttpStatusCode.OK) { ReasonPhrase = "OK" });

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient(handler.Object));

        var sut = new AuthController(mockAuth.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.PingExternal(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task PingExternal_WhenHttpRequestException_Returns502()
    {
        var mockAuth = new Mock<IAuthService>();
        var cur = new Mock<ICurrentUser>();

        var handler = new Mock<HttpMessageHandler>();
        handler.Protected()
            .Setup<Task<HttpResponseMessage>>(
                "SendAsync",
                ItExpr.IsAny<HttpRequestMessage>(),
                ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("network"));

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient(handler.Object));

        var sut = new AuthController(mockAuth.Object, cur.Object, factory.Object, NullLogger<AuthController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.PingExternal(CancellationToken.None);

        var obj = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(502, obj.StatusCode);
    }
}
