using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.Validators.Auth;
using Xunit;

namespace Cms.Application.Tests.Auth;

public sealed class LoginRequestValidatorTests
{
    private readonly LoginRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenValid_ReturnsValid()
    {
        var request = new LoginRequest("user@example.com", "secret");
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenEmailEmpty_ReturnsInvalid()
    {
        var request = new LoginRequest("", "secret");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenEmailInvalid_ReturnsInvalid()
    {
        var request = new LoginRequest("not-an-email", "secret");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordEmpty_ReturnsInvalid()
    {
        var request = new LoginRequest("user@example.com", "");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }
}
