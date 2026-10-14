using Cms.Application.DTOs.SiteSettings;
using Cms.Application.Validators.SiteSettings;
using Xunit;

namespace Cms.Application.Tests.SiteSettings;

public sealed class UpdateSiteSettingsRequestValidatorTests
{
    private readonly UpdateSiteSettingsRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenSupportedLangsNull_ReturnsValid()
    {
        var request = new UpdateSiteSettingsRequest(
            SiteName: null,
            SiteDescription: null,
            Favicon: null,
            OgImage: null,
            ShowNavigation: null,
            NavigationPosition: null,
            NavigationStyle: null,
            ShowLogo: null,
            LogoUrl: null,
            EnableSearch: null,
            GoogleAnalyticsId: null,
            CustomHeadCode: null,
            EnableSocialSharing: null,
            TwitterHandle: null,
            CustomDomain: null,
            RobotsTxt: null,
            CanonicalUrl: null,
            GlobalCss: null,
            HeadScripts: null,
            BodyScripts: null,
            SupportedLangs: null);

        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenSupportedLangsValid_ReturnsValid()
    {
        var request = EmptyRequest() with { SupportedLangs = ["en-gb", "fr-fr"] };
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenSupportedLangsHasWrongLength_ReturnsInvalid()
    {
        var request = EmptyRequest() with { SupportedLangs = ["en"] };
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenSupportedLangsHasInvalidPattern_ReturnsInvalid()
    {
        var request = EmptyRequest() with { SupportedLangs = ["xx_yy"] };
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenSupportedLangsHasWhitespaceEntry_ReturnsInvalid()
    {
        var request = EmptyRequest() with { SupportedLangs = ["en-GB", "     "] };
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    private static UpdateSiteSettingsRequest EmptyRequest() =>
        new(
            SiteName: null,
            SiteDescription: null,
            Favicon: null,
            OgImage: null,
            ShowNavigation: null,
            NavigationPosition: null,
            NavigationStyle: null,
            ShowLogo: null,
            LogoUrl: null,
            EnableSearch: null,
            GoogleAnalyticsId: null,
            CustomHeadCode: null,
            EnableSocialSharing: null,
            TwitterHandle: null,
            CustomDomain: null,
            RobotsTxt: null,
            CanonicalUrl: null,
            GlobalCss: null,
            HeadScripts: null,
            BodyScripts: null,
            SupportedLangs: []);
}
