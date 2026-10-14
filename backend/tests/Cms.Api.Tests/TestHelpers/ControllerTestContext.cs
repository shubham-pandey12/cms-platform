using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Cms.Api.Tests.TestHelpers;

internal static class ControllerTestContext
{
    public static ControllerContext Create(
        Action<DefaultHttpContext>? configure = null,
        ClaimsPrincipal? user = null)
    {
        var httpContext = new DefaultHttpContext();
        configure?.Invoke(httpContext);
        if (user is not null)
            httpContext.User = user;

        return new ControllerContext { HttpContext = httpContext };
    }

    public static ClaimsPrincipal UserWithId(Guid userId) =>
        new(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            authenticationType: "Test"));
}
