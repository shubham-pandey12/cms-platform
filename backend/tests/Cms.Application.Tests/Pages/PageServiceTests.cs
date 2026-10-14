using Microsoft.Extensions.Logging;
using Moq;
using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Services.Pages;
using Cms.Domain.Entities;
using Xunit;

namespace Cms.Application.Tests.Pages;

public sealed class PageServiceTests
{
    [Fact]
    public async Task GetByUriAsync_WhenSubdomainNotResolved_ReturnsNull()
    {
        var pageRepo = new Mock<IPageRepository>();
        var brandRepo = new Mock<IBrandRepository>();
        brandRepo
            .Setup(b => b.GetBySubdomainAsync("unknown-slug", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Brand?)null);
        var revisionRepo = new Mock<IPageRevisionRepository>();
        var sut = new PageService(pageRepo.Object, brandRepo.Object, revisionRepo.Object, Mock.Of<ILogger<PageService>>());

        var result = await sut.GetByUriAsync("unknown-slug", "/path", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateAsync_WhenPageMissing_ThrowsKeyNotFoundException()
    {
        var id = Guid.NewGuid();
        var pageRepo = new Mock<IPageRepository>();
        pageRepo.Setup(p => p.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync((Page?)null);
        var brandRepo = new Mock<IBrandRepository>();
        var revisionRepo = new Mock<IPageRevisionRepository>();
        var sut = new PageService(pageRepo.Object, brandRepo.Object, revisionRepo.Object, Mock.Of<ILogger<PageService>>());
        var update = new UpdatePageRequest(null, null, null, null, null, null, null, null, null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            sut.UpdateAsync(id, update, Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task PublishAsync_WhenVersionNotSemantic_ThrowsArgumentException()
    {
        var id = Guid.NewGuid();
        var page = new Page { Id = id, BrandId = Guid.NewGuid(), Uri = "/", Name = "P" };
        var pageRepo = new Mock<IPageRepository>();
        pageRepo.Setup(p => p.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(page);
        var brandRepo = new Mock<IBrandRepository>();
        var revisionRepo = new Mock<IPageRevisionRepository>();
        var sut = new PageService(pageRepo.Object, brandRepo.Object, revisionRepo.Object, Mock.Of<ILogger<PageService>>());
        var request = new PublishPageRequest("not-semver");

        await Assert.ThrowsAsync<ArgumentException>(() =>
            sut.PublishAsync(id, request, Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task GetRevisionByIdAsync_WhenRevisionBelongsToOtherPage_ReturnsNull()
    {
        var pageId = Guid.NewGuid();
        var revisionId = Guid.NewGuid();
        var revision = new PageRevision { Id = revisionId, PageId = Guid.NewGuid(), Seo = new() };
        var pageRepo = new Mock<IPageRepository>();
        var brandRepo = new Mock<IBrandRepository>();
        var revisionRepo = new Mock<IPageRevisionRepository>();
        revisionRepo.Setup(r => r.GetByIdAsync(revisionId, It.IsAny<CancellationToken>())).ReturnsAsync(revision);
        var sut = new PageService(pageRepo.Object, brandRepo.Object, revisionRepo.Object, Mock.Of<ILogger<PageService>>());

        var result = await sut.GetRevisionByIdAsync(pageId, revisionId, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetSitemapXmlAsync_WhenBaseUrlWhitespace_ThrowsArgumentException()
    {
        var pageRepo = new Mock<IPageRepository>();
        var brandRepo = new Mock<IBrandRepository>();
        var revisionRepo = new Mock<IPageRevisionRepository>();
        var sut = new PageService(pageRepo.Object, brandRepo.Object, revisionRepo.Object, Mock.Of<ILogger<PageService>>());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            sut.GetSitemapXmlAsync(Guid.NewGuid(), "   ", CancellationToken.None));
    }
}
