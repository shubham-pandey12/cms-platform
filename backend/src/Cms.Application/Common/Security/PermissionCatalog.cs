namespace Cms.Application.Common.Security;

/// <summary>
/// Central RBAC permission keys used by persistence seed, authorization policies, and UI contracts.
/// </summary>
public static class PermissionCatalog
{
    public const string UsersRead = "users.read";
    public const string UsersManage = "users.manage";
    public const string BrandsManage = "brands.manage";
    public const string RedirectsManage = "redirects.manage";
    public const string ThemesRead = "themes.read";
    public const string ThemesManage = "themes.manage";
    public const string ThemesDelete = "themes.delete";
    public const string MediaRead = "media.read";
    public const string MediaManage = "media.manage";
    public const string RolesRead = "roles.read";
    public const string RolesManage = "roles.manage";

    public static readonly IReadOnlyList<string> All =
    [
        UsersRead,
        UsersManage,
        BrandsManage,
        RedirectsManage,
        ThemesRead,
        ThemesManage,
        ThemesDelete,
        MediaRead,
        MediaManage,
        RolesRead,
        RolesManage
    ];
}

