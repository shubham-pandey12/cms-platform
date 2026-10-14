using Cms.Application.DTOs.Redirects;
using Cms.Application.Validators.Redirects;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Redirects;

public sealed class UpdateRedirectRequestValidatorTests
{
    private readonly UpdateRedirectRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenAllFieldsNull_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest(null, null, null);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenOnlyFromProvidedAndValid_ReturnsValid()
    {
        var request = new UpdateRedirectRequest("/x", null, null);
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenOnlyToProvidedAndValid_ReturnsValid()
    {
        var request = new UpdateRedirectRequest(null, "/y", null);
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenOnlyStatusProvided_ReturnsValid()
    {
        var request = new UpdateRedirectRequest(null, null, RedirectStatus.Found);
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromEmptyString_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest("", null, null);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToEmptyString_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest(null, "", null);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenFromHasQuery_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest("/a?q=1", null, null);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenToIsSchemeRelative_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest(null, "//x", null);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenStatusNot301Or302_ReturnsInvalid()
    {
        var request = new UpdateRedirectRequest(null, null, (RedirectStatus)303);
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }
}
