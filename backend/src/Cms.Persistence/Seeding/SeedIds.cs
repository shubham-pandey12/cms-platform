namespace Cms.Persistence.Seeding;

/// <summary>
/// Predefined IDs for seed data to ensure consistency.
/// </summary>
internal static class BrandIds
{
    public static readonly Guid Brand1 = new("11111111-1111-1111-1111-111111111111");
}

internal static class UserIds
{
    public static readonly Guid Admin = new("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    public static readonly Guid ContentEditor = new("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    public static readonly Guid Sarah = new("cccccccc-cccc-cccc-cccc-cccccccccccc");
    public static readonly Guid Mike = new("dddddddd-dddd-dddd-dddd-dddddddddddd");
}

internal static class RbacRoleIds
{
    public static readonly Guid Admin = new("e1000000-0000-0000-0000-000000000001");
    public static readonly Guid ContentTeam = new("e1000000-0000-0000-0000-000000000002");
    public static readonly Guid Engineer = new("e1000000-0000-0000-0000-000000000003");
}

internal static class RbacPermissionIds
{
    public static readonly Guid UsersRead = new("e2000000-0000-0000-0000-000000000001");
    public static readonly Guid UsersManage = new("e2000000-0000-0000-0000-000000000002");
    public static readonly Guid BrandsManage = new("e2000000-0000-0000-0000-000000000003");
    public static readonly Guid RedirectsManage = new("e2000000-0000-0000-0000-000000000004");
    public static readonly Guid ThemesRead = new("e2000000-0000-0000-0000-000000000005");
    public static readonly Guid ThemesManage = new("e2000000-0000-0000-0000-000000000006");
    public static readonly Guid ThemesDelete = new("e2000000-0000-0000-0000-000000000007");
    public static readonly Guid MediaRead = new("e2000000-0000-0000-0000-000000000008");
    public static readonly Guid MediaManage = new("e2000000-0000-0000-0000-000000000009");
    public static readonly Guid RolesRead = new("e2000000-0000-0000-0000-00000000000a");
    public static readonly Guid RolesManage = new("e2000000-0000-0000-0000-00000000000b");
}

internal static class ThemeIds
{
    public static readonly Guid Simple = new("10000000-0000-0000-0000-000000000001");
    public static readonly Guid Vision = new("10000000-0000-0000-0000-000000000002");
    public static readonly Guid Aristotle = new("10000000-0000-0000-0000-000000000003");
    public static readonly Guid Modern = new("10000000-0000-0000-0000-000000000004");
    public static readonly Guid Diplomat = new("10000000-0000-0000-0000-000000000005");
    public static readonly Guid Dark = new("10000000-0000-0000-0000-000000000006");
    public static readonly Guid Luxury = new("10000000-0000-0000-0000-000000000007");
    public static readonly Guid Ocean = new("10000000-0000-0000-0000-000000000008");
}

internal static class LayoutIds
{
    public static readonly Guid Default = new("20000000-0000-0000-0000-000000000001");
}

internal static class PageIds
{
    public static readonly Guid Home = new("30000000-0000-0000-0000-000000000001");
    public static readonly Guid Destinations = new("30000000-0000-0000-0000-000000000004");
}

internal static class RevisionIds
{
    public static readonly Guid HomeDraft = new("40000000-0000-0000-0000-000000000001");
    public static readonly Guid HomePublished = new("40000000-0000-0000-0000-000000000002");
}

internal static class PageDataConfigIds
{
    public static readonly Guid Home = new("60000000-0000-0000-0000-000000000001");
}

