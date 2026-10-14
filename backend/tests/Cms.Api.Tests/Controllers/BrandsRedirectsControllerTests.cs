using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Redirects;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class BrandsRedirectsControllerTests
{
    private static RedirectDto SampleRedirect(Guid brandId, Guid? id = null)
    {
        var rid = id ?? Guid.NewGuid();
        return new RedirectDto(rid, "/a", "/b", brandId, RedirectStatus.Found, DateTime.UtcNow, null);
    }

    [Fact]
    public async Task Resolve_WhenNull_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.ResolveAsync(brandId, path: "/", It.IsAny<CancellationToken>())).ReturnsAsync((RedirectResolveDto?)null);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Resolve(brandId, path: null, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Resolve_WhenKeyNotFound_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.ResolveAsync(brandId, "/", It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Resolve(brandId, "/", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Resolve_WhenFound_ReturnsOk()
    {
        var brandId = Guid.NewGuid();
        var dto = new RedirectResolveDto("/to", RedirectStatus.MovedPermanently);
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.ResolveAsync(brandId, "/p", It.IsAny<CancellationToken>())).ReturnsAsync(dto);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Resolve(brandId, "/p", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(dto, ok.Value);
    }

    [Fact]
    public async Task GetList_WhenKeyNotFound_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.ListByBrandAsync(brandId, It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetList(brandId, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var brandId = Guid.NewGuid();
        var created = SampleRedirect(brandId);
        var req = new CreateRedirectRequest("/f", "/t", RedirectStatus.Found);
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.CreateAsync(brandId, req, It.IsAny<CancellationToken>())).ReturnsAsync(created);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Create(brandId, req, CancellationToken.None);

        var c = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(BrandsRedirectsController.GetById), c.ActionName);
        Assert.Equal(created.Id, c.RouteValues!["id"]);
        Assert.Equal(brandId, c.RouteValues["brandId"]);
    }

    [Fact]
    public async Task GetById_WhenNull_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.GetAsync(brandId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((RedirectDto?)null);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(brandId, Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenNull_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var req = new UpdateRedirectRequest(null, null, null);
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.UpdateAsync(brandId, It.IsAny<Guid>(), req, It.IsAny<CancellationToken>())).ReturnsAsync((RedirectDto?)null);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(brandId, Guid.NewGuid(), req, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Delete_WhenFalse_ReturnsNotFound()
    {
        var brandId = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.DeleteAsync(brandId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(brandId, Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenTrue_ReturnsNoContent()
    {
        var brandId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var mock = new Mock<IRedirectService>();
        mock.Setup(s => s.DeleteAsync(brandId, id, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new BrandsRedirectsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(brandId, id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }
}
