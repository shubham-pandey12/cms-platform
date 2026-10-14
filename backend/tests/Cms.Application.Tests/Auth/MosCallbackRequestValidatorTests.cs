using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.Validators.Auth;
using Xunit;

namespace Cms.Application.Tests.Auth;

public sealed class MosCallbackRequestValidatorTests
{
    private readonly MosCallbackRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenValid_ReturnsValid()
    {
        var request = new MosCallbackRequest("auth-code", "https://app/callback");
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenCodeEmpty_ReturnsInvalid()
    {
        var request = new MosCallbackRequest("", "https://app/callback");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenRedirectUriEmpty_ReturnsInvalid()
    {
        var request = new MosCallbackRequest("auth-code", "");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }
}
