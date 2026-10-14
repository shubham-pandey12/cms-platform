using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.Validators.Pages;
using Xunit;

namespace Cms.Application.Tests.Pages;

public sealed class CreatePageRequestValidatorTests
{
    private readonly CreatePageRequestValidator _sut = new();

    private static CreatePageRequest ValidRequest()
    {
        var brandId = Guid.NewGuid();
        var layoutId = Guid.NewGuid();
        return new CreatePageRequest(brandId, "Home", "/home", false, null, null, layoutId, null, null);
    }

    [Fact]
    public void Validate_WhenValid_ReturnsValid()
    {
        var result = _sut.Validate(ValidRequest());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenBrandIdEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { BrandId = Guid.Empty };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenNameEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { Name = "" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenUriMissingLeadingSlash_ReturnsInvalid()
    {
        var r = ValidRequest() with { Uri = "home" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenUriEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { Uri = "" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenLayoutIdEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { LayoutId = Guid.Empty };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }
}
