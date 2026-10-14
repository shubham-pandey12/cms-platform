using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Moq;
using Cms.Application.DTOs.Redirects;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Services.Redirects;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Redirects;

public sealed class RedirectServiceTests
{
    [Fact]
    public async Task CreateAsync_WhenRedirectToSamePath_ThrowsInvalidOperation()
    {
        var brandId = Guid.NewGuid();
        var sut = BuildService(
            brandId,
            existingRedirects: [],
            duplicateForFrom: null);

        var request = new CreateRedirectRequest("/old-path", " old-path/ ", RedirectStatus.MovedPermanently);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.CreateAsync(brandId, request, CancellationToken.None));
    }

    [Fact]
    public async Task CreateAsync_WhenRedirectCreatesChainLoop_ThrowsInvalidOperation()
    {
        var brandId = Guid.NewGuid();
        var existing = new List<Redirect>
        {
            new() { Id = Guid.NewGuid(), BrandId = brandId, From = "/b", To = "/c", Status = RedirectStatus.Found },
            new() { Id = Guid.NewGuid(), BrandId = brandId, From = "/c", To = "/a", Status = RedirectStatus.Found },
        };
        var sut = BuildService(brandId, existing, duplicateForFrom: null);

        var request = new CreateRedirectRequest("/a", "/b", RedirectStatus.Found);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.CreateAsync(brandId, request, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateAsync_WhenRedirectCreatesLoop_ThrowsInvalidOperation()
    {
        var brandId = Guid.NewGuid();
        var edited = new Redirect
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            From = "/a",
            To = "/b",
            Status = RedirectStatus.Found,
        };
        var existing = new List<Redirect>
        {
            edited,
            new() { Id = Guid.NewGuid(), BrandId = brandId, From = "/c", To = "/a", Status = RedirectStatus.Found },
        };

        var redirectRepo = new Mock<IRedirectRepository>();
        redirectRepo
            .Setup(r => r.GetByIdAndBrandIdAsync(edited.Id, brandId, true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(edited);
        redirectRepo
            .Setup(r => r.FindByBrandAndFromAsync(brandId, "/b", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Redirect?)null);
        redirectRepo
            .Setup(r => r.GetByBrandIdAsync(brandId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var brandRepo = new Mock<IBrandRepository>();
        brandRepo.Setup(r => r.ExistsAsync(brandId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var createValidator = AlwaysValidCreateValidator();
        var updateValidator = AlwaysValidUpdateValidator();
        var logger = Mock.Of<ILogger<RedirectService>>();
        var sut = new RedirectService(redirectRepo.Object, brandRepo.Object, createValidator.Object, updateValidator.Object, logger);

        var request = new UpdateRedirectRequest("/b", null, null);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.UpdateAsync(brandId, edited.Id, request, CancellationToken.None));
    }

    [Theory]
    [InlineData(" /promo/// ", "/promo")]
    [InlineData("/promo/?utm=1", "/promo")]
    [InlineData("promo#section", "/promo")]
    public void RedirectPathNormalizer_NormalizesCommonVariants(string raw, string expected)
    {
        var normalized = RedirectPathNormalizer.Normalize(raw);
        Assert.Equal(expected, normalized);
    }

    private static RedirectService BuildService(Guid brandId, List<Redirect> existingRedirects, Redirect? duplicateForFrom)
    {
        var redirectRepo = new Mock<IRedirectRepository>();
        redirectRepo
            .Setup(r => r.FindByBrandAndFromAsync(brandId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid _, string _, CancellationToken _) => duplicateForFrom);
        redirectRepo
            .Setup(r => r.GetByBrandIdAsync(brandId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingRedirects);
        redirectRepo
            .Setup(r => r.AddAsync(It.IsAny<Redirect>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Redirect r, CancellationToken _) => r);
        redirectRepo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var brandRepo = new Mock<IBrandRepository>();
        brandRepo.Setup(r => r.ExistsAsync(brandId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var createValidator = AlwaysValidCreateValidator();
        var updateValidator = AlwaysValidUpdateValidator();

        return new RedirectService(
            redirectRepo.Object,
            brandRepo.Object,
            createValidator.Object,
            updateValidator.Object,
            Mock.Of<ILogger<RedirectService>>());
    }

    private static Mock<IValidator<CreateRedirectRequest>> AlwaysValidCreateValidator()
    {
        var validator = new Mock<IValidator<CreateRedirectRequest>>();
        validator
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<CreateRedirectRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());
        return validator;
    }

    private static Mock<IValidator<UpdateRedirectRequest>> AlwaysValidUpdateValidator()
    {
        var validator = new Mock<IValidator<UpdateRedirectRequest>>();
        validator
            .Setup(v => v.ValidateAsync(It.IsAny<ValidationContext<UpdateRedirectRequest>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());
        return validator;
    }
}
