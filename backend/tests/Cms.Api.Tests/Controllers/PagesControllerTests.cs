using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Api.Tests.TestHelpers;
using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.DTOs.Pages.Responses;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class PagesControllerTests
{
    private static PageDto SamplePage(Guid? id = null)
    {
        var pid = id ?? Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var draft = Guid.NewGuid();
        var seo = new PageSeoDto("t", "d", [], null, null, null, null, false, false);
        return new PageDto(
            pid,
            brandId,
            "Home",
            "/",
            false,
            [],
            PageStatus.Draft,
            seo,
            Guid.NewGuid(),
            "<p></p>",
            null,
            null,
            null,
            "1.0.0",
            null,
            draft,
            now,
            now,
            null,
            Guid.NewGuid(),
            Guid.NewGuid(),
            null);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPages()
    {
        var pages = new List<PageDto> { SamplePage() };
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(pages);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(pages, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((PageDto?)null);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var p = SamplePage();
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetByIdAsync(p.Id, It.IsAny<CancellationToken>())).ReturnsAsync(p);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(p.Id, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(p, ok.Value);
    }

    [Fact]
    public async Task GetRevisions_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetRevisionsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new KeyNotFoundException());

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetRevisions(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetRevisions_WhenFound_ReturnsOk()
    {
        var list = new List<PageRevisionDto>();
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetRevisionsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetRevisions(Guid.NewGuid(), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task GetRevisionById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetRevisionByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((PageRevisionDetailDto?)null);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetRevisionById(Guid.NewGuid(), Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetByUri_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.GetByUriAsync("slug", "/", It.IsAny<CancellationToken>())).ReturnsAsync((PageDto?)null);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetByUri("slug", "/", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var userId = Guid.NewGuid();
        var page = SamplePage();
        var req = new CreatePageRequest(
            Guid.NewGuid(),
            "P",
            "/p",
            false,
            null,
            null,
            Guid.NewGuid(),
            null,
            null);
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.CreateAsync(req, userId, It.IsAny<CancellationToken>())).ReturnsAsync(page);

        var sut = new PagesController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Create(req, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(PagesController.GetById), created.ActionName);
        Assert.Equal(page.Id, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task Update_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var page = SamplePage();
        var req = new UpdatePageRequest(null, null, null, null, null, null, null, null, null);
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.UpdateAsync(page.Id, req, userId, It.IsAny<CancellationToken>())).ReturnsAsync(page);

        var sut = new PagesController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Update(page.Id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(page, ok.Value);
    }

    [Fact]
    public async Task Publish_WhenArgumentException_ReturnsBadRequest()
    {
        var userId = Guid.NewGuid();
        var id = Guid.NewGuid();
        var pub = new PublishPageRequest("1.0.0", null);
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.PublishAsync(id, pub, userId, It.IsAny<CancellationToken>())).ThrowsAsync(new ArgumentException("bad"));

        var sut = new PagesController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Publish(id, pub, CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("bad", bad.Value);
    }

    [Fact]
    public async Task Publish_WhenSuccess_ReturnsOk()
    {
        var userId = Guid.NewGuid();
        var page = SamplePage();
        var pub = new PublishPageRequest("1.0.0", null);
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.PublishAsync(page.Id, pub, userId, It.IsAny<CancellationToken>())).ReturnsAsync(page);

        var sut = new PagesController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Publish(page.Id, pub, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(page, ok.Value);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IPageService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = new PagesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }
}
