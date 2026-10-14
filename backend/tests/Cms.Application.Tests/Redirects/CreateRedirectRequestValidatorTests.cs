using Cms.Application.DTOs.Redirects;
using Cms.Application.Validators.Redirects;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Redirects;

public sealed class CreateRedirectRequestValidatorTests
{
    private readonly CreateRedirectRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenValidInternalPaths_ReturnsValid()
    {
        var request = new CreateRedirectRequest("/old", "/new", RedirectStatus.MovedPermanently);
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToIsHttpsUrl_ReturnsValid()
    {
        var request = new CreateRedirectRequest("/old", "https://example.com/x", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromIsEmpty_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("", "/b", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToIsEmpty_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a", "", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromContainsQuery_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a?x=1", "/b", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromContainsFragment_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a#x", "/b", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromIsAbsoluteUri_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("https://evil/x", "/b", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToIsSchemeRelative_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a", "//evil.com", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToIsNonHttpAbsolute_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a", "ftp://example.com", RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenStatusNot301Or302_ReturnsInvalid()
    {
        var request = new CreateRedirectRequest("/a", "/b", (RedirectStatus)303);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }
}
