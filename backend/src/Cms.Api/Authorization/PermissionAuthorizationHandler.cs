using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Cms.Application.Interfaces.Services;

namespace Cms.Api.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IPermissionResolver _permissionResolver;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public PermissionAuthorizationHandler(IPermissionResolver permissionResolver, IHttpContextAccessor httpContextAccessor)
    {
        ArgumentNullException.ThrowIfNull(permissionResolver);
        ArgumentNullException.ThrowIfNull(httpContextAccessor);
        _permissionResolver = permissionResolver;
        _httpContextAccessor = httpContextAccessor;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var userIdRaw = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdRaw, out var userId))
        {
            context.Fail();
            return;
        }

        Guid? brandId = null;
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Request.RouteValues.TryGetValue("brandId", out var routeBrand) == true
            && Guid.TryParse(routeBrand?.ToString(), out var parsedBrand)
            && parsedBrand != Guid.Empty)
        {
            brandId = parsedBrand;
        }

        var allowed = await _permissionResolver.HasPermissionAsync(
            userId,
            requirement.PermissionKey,
            brandId,
            httpContext?.RequestAborted ?? CancellationToken.None);

        if (allowed)
        {
            context.Succeed(requirement);
        }
    }
}

