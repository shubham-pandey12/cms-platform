namespace Cms.Application.Common.Security;

/// <summary>
/// Authorization policy names mapped to permission keys.
/// </summary>
public static class PolicyCatalog
{
    public const string UsersRead = "policy.users.read";
    public const string UsersManage = "policy.users.manage";
    public const string BrandsManage = "policy.brands.manage";
    public const string RedirectsManage = "policy.redirects.manage";
    public const string ThemesRead = "policy.themes.read";
    public const string ThemesManage = "policy.themes.manage";
    public const string ThemesDelete = "policy.themes.delete";
    public const string RolesRead = "policy.roles.read";
    public const string RolesManage = "policy.roles.manage";
    public const string MediaRead = "policy.media.read";
    public const string MediaManage = "policy.media.manage";
}

