using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Cms.Application.Services.Infrastructure;
using Cms.Domain.Entities;
using Xunit;

namespace Cms.Application.Tests.Infrastructure;

public sealed class JwtServiceTests
{
    private static IConfiguration CreateConfig(string? key = null)
    {
        var k = key ?? new string('a', 48);
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = k,
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience",
                ["Jwt:ExpirationMinutes"] = "120",
            })
            .Build();
    }

    [Fact]
    public void GenerateToken_WhenKeyMissing_ThrowsInvalidOperationException()
    {
        var emptyConfig = new ConfigurationBuilder().AddInMemoryCollection().Build();
        var sut = new JwtService(emptyConfig, Mock.Of<ILogger<JwtService>>());
        var user = new ApplicationUser { Id = Guid.NewGuid(), Email = "a@b.co", Name = "N" };

        Assert.Throws<InvalidOperationException>(() => sut.GenerateToken(user, []));
    }

    [Fact]
    public void GenerateToken_ReturnsParsableJwtWithSubClaim()
    {
        var sut = new JwtService(CreateConfig(), Mock.Of<ILogger<JwtService>>());
        var userId = Guid.NewGuid();
        var user = new ApplicationUser { Id = userId, Email = "user@test.com", Name = "User" };

        var token = sut.GenerateToken(user, ["ContentTeam"]);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        Assert.Equal(userId.ToString(), jwt.Subject);
        Assert.Contains(jwt.Claims, c => c.Type == ClaimTypes.Role && c.Value == "ContentTeam");
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsDistinctBase64Strings()
    {
        var sut = new JwtService(CreateConfig(), Mock.Of<ILogger<JwtService>>());

        var a = sut.GenerateRefreshToken();
        var b = sut.GenerateRefreshToken();

        Assert.NotEqual(a, b);
        Assert.NotEmpty(Convert.FromBase64String(a));
    }
}
