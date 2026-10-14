using Microsoft.Extensions.Logging;
using Moq;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Services.Brands;
using Cms.Domain.Entities;
using Xunit;

namespace Cms.Application.Tests.Brands;

public sealed class BrandServiceTests
{
    private static BrandService CreateSut(
        Mock<IBrandRepository>? brandRepo = null,
        Mock<IBrandDomainRepository>? domainRepo = null,
        Mock<ISiteLayoutRepository>? layoutRepo = null,
        Mock<IThemeRepository>? themeRepo = null,
        Mock<ISiteSettingsRepository>? settingsRepo = null)
    {
        return new BrandService(
            (brandRepo ?? new Mock<IBrandRepository>()).Object,
            (domainRepo ?? new Mock<IBrandDomainRepository>()).Object,
            (layoutRepo ?? new Mock<ISiteLayoutRepository>()).Object,
            (themeRepo ?? new Mock<IThemeRepository>()).Object,
            (settingsRepo ?? new Mock<ISiteSettingsRepository>()).Object,
            Mock.Of<ILogger<BrandService>>());
    }

    [Fact]
    public async Task GetByIdOrSlugAsync_WhenGuidMatches_ReturnsDto()
    {
        var id = Guid.NewGuid();
        var brand = new Brand { Id = id, Name = "Acme", Domain = "acme.test", Subdomain = "acme" };
        var repo = new Mock<IBrandRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(brand);
        var sut = CreateSut(brandRepo: repo);

        var result = await sut.GetByIdOrSlugAsync(id.ToString(), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(id, result!.Id);
        Assert.Equal("Acme", result.Name);
    }

    [Fact]
    public async Task GetByIdOrSlugAsync_WhenGuidMissesButSubdomainHits_ReturnsDto()
    {
        var brand = new Brand { Id = Guid.NewGuid(), Name = "Beta", Domain = "beta.test", Subdomain = "beta" };
        var repo = new Mock<IBrandRepository>();
        repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Brand?)null);
        repo.Setup(r => r.GetBySubdomainAsync("beta", It.IsAny<CancellationToken>())).ReturnsAsync(brand);
        var sut = CreateSut(brandRepo: repo);

        var result = await sut.GetByIdOrSlugAsync("beta", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("beta", result!.Subdomain);
    }

    [Fact]
    public async Task GetByHostAsync_WhenUnknown_ReturnsNull()
    {
        var repo = new Mock<IBrandRepository>();
        repo.Setup(r => r.GetByHostAsync("unknown.example", It.IsAny<CancellationToken>())).ReturnsAsync((Brand?)null);
        var sut = CreateSut(brandRepo: repo);

        var result = await sut.GetByHostAsync("unknown.example", CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task CheckAvailabilityAsync_WhenDomainTaken_ReturnsUnavailable()
    {
        var existingId = Guid.NewGuid();
        var existing = new Brand { Id = existingId, Name = "X", Domain = "taken.com", Subdomain = "x" };
        var repo = new Mock<IBrandRepository>();
        repo.Setup(r => r.GetByDomainAsync("taken.com", It.IsAny<CancellationToken>())).ReturnsAsync(existing);
        var sut = CreateSut(brandRepo: repo);

        var result = await sut.CheckAvailabilityAsync("taken.com", null, null, CancellationToken.None);

        Assert.False(result.DomainAvailable);
        Assert.True(result.SubdomainAvailable);
    }
}
