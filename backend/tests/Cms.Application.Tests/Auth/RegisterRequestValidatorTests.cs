using Cms.Application.DTOs.Auth.Requests;
using Cms.Application.Validators.Auth;
using Xunit;

namespace Cms.Application.Tests.Auth;

public sealed class RegisterRequestValidatorTests
{
    private readonly RegisterRequestValidator _sut = new();

    [Fact]
    public void Validate_WhenValid_ReturnsValid()
    {
        var request = new RegisterRequest("user@example.com", "Abcdef1!", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.True(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordTooShort_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "Ab1!x", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordMissingUppercase_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "abcdef1!", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordMissingLowercase_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "ABCDEF1!", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordMissingDigit_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "Abcdefgh!", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenPasswordMissingSpecial_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "Abcdef12", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenNameEmpty_ReturnsInvalid()
    {
        var request = new RegisterRequest("user@example.com", "Abcdef1!", "");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Validate_WhenEmailInvalid_ReturnsInvalid()
    {
        var request = new RegisterRequest("bad", "Abcdef1!", "Jane Doe");
        var result = _sut.Validate(request);
        Assert.False(result.IsValid);
    }
}
