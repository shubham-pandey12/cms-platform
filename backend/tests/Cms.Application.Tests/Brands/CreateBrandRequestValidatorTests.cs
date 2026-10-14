using Cms.Application.DTOs.Brands.Requests;
using Cms.Application.Validators.Brands;
using Xunit;

namespace Cms.Application.Tests.Brands;

public sealed class CreateBrandRequestValidatorTests
{
    private readonly CreateBrandRequestValidator _sut = new();

    private static CreateBrandRequest ValidRequest() =>
        new(
            Name: "Acme",
            Domain: "acme.example",
            Subdomain: null,
            Logo: null,
            PrimaryColor: "#112233",
            SecondaryColor: "#abcdef",
            GlobalCss: null,
            CustomFontUrls: null);

    [Fact]
    public void Validate_WhenValid_ReturnsValid()
    {
        var result = _sut.Validate(ValidRequest());
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenThreeDigitHexColors_ReturnsValid()
    {
        var r = ValidRequest() with { PrimaryColor = "#abc", SecondaryColor = "#def" };
        var result = _sut.Validate(r);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenNameEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { Name = "" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenDomainEmpty_ReturnsInvalid()
    {
        var r = ValidRequest() with { Domain = "" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPrimaryColorInvalidHex_ReturnsInvalid()
    {
        var r = ValidRequest() with { PrimaryColor = "red" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenSecondaryColorInvalidHex_ReturnsInvalid()
    {
        var r = ValidRequest() with { SecondaryColor = "#gg0000" };
        var result = _sut.Validate(r);
        Assert.False(result.IsValid);
    }
}
