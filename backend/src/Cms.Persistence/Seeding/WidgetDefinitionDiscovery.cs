using System.Reflection;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Cms.Domain.Interfaces;

namespace Cms.Persistence.Seeding;

/// <summary>
/// Denormalized palette metadata from <see cref="WidgetVersionInfo"/> for the winning semantic version per slug.
/// </summary>
internal sealed record WidgetPaletteDenorm(
    string VersionString,
    WidgetCategory Category,
    string Icon,
    string? Thumbnail,
    List<Guid> BrandIds,
    bool IsAdvanced,
    bool SupportsHtmlEmbed);

/// <summary>
/// Discovers widget definitions from IWidgetDefinitionProvider and IWidgetVersionProvider 
/// implementations in the assembly (e.g. Definition.cs files under widgets/).
/// </summary>
internal static class WidgetDefinitionDiscovery
{
    /// <summary>
    /// Result of widget discovery containing both definitions and their versions.
    /// </summary>
    public record DiscoveryResult(
        List<WidgetDefinition> Definitions,
        List<WidgetDefinitionVersion> Versions
    );

    /// <summary>
    /// Discovers all widget definitions and versions from the assembly.
    /// Supports both legacy IWidgetDefinitionProvider and new IWidgetVersionProvider interfaces.
    /// </summary>
    public static DiscoveryResult DiscoverAll()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var discoveredVersionIds = new Dictionary<Guid, string>();

        var legacyDefinitions = DiscoverLegacyProviders(assembly, discoveredVersionIds);
        var (versionedWidgets, paletteBySlug) = DiscoverVersionProviders(assembly, discoveredVersionIds);

        var allDefinitions = MergeDefinitions(legacyDefinitions, versionedWidgets, paletteBySlug);

        return new DiscoveryResult(
            allDefinitions.OrderBy(w => w.Slug, StringComparer.OrdinalIgnoreCase).ToList(),
            versionedWidgets.SelectMany(kvp => kvp.Value).ToList()
        );
    }

    /// <summary>
    /// Legacy method for backward compatibility. Returns only widget definitions.
    /// </summary>
    public static List<WidgetDefinition> GetDiscovered()
    {
        return DiscoverAll().Definitions;
    }

    private static List<WidgetDefinition> DiscoverLegacyProviders(
        Assembly assembly,
        Dictionary<Guid, string> discoveredVersionIds)
    {
        var providerType = typeof(IWidgetDefinitionProvider);
        var list = new List<WidgetDefinition>();
        var discoveredSlugs = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var type in assembly.GetTypes())
        {
            if (type.IsInterface || type.IsAbstract || !providerType.IsAssignableFrom(type))
                continue;

            if (typeof(IWidgetVersionProvider).IsAssignableFrom(type))
                continue;

            try
            {
                var instance = Activator.CreateInstance(type);
                if (instance is IWidgetDefinitionProvider provider)
                {
                    var definition = provider.GetDefinition()
                        ?? throw new InvalidOperationException(
                            $"Widget provider {type.FullName} returned null.");
                    ValidateLegacyDefinition(definition, type, discoveredSlugs, discoveredVersionIds);
                    list.Add(definition);
                }
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException(
                    $"Failed to create IWidgetDefinitionProvider implementation {type.FullName}.", ex);
            }
        }

        return list;
    }

    private static (
        Dictionary<string, List<WidgetDefinitionVersion>> VersionsBySlug,
        Dictionary<string, WidgetPaletteDenorm> PaletteBySlug) DiscoverVersionProviders(
        Assembly assembly,
        Dictionary<Guid, string> discoveredVersionIds)
    {
        var providerType = typeof(IWidgetVersionProvider);
        var versionsBySlug = new Dictionary<string, List<WidgetDefinitionVersion>>(StringComparer.OrdinalIgnoreCase);
        var paletteBySlug = new Dictionary<string, WidgetPaletteDenorm>(StringComparer.OrdinalIgnoreCase);
        var discoveredSlugVersions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var type in assembly.GetTypes())
        {
            if (type.IsInterface || type.IsAbstract || !providerType.IsAssignableFrom(type))
                continue;

            try
            {
                var instance = Activator.CreateInstance(type);
                if (instance is IWidgetVersionProvider provider)
                {
                    var info = provider.GetVersionInfo();
                    var version = CreateVersionEntity(provider, type, discoveredSlugVersions, discoveredVersionIds, info);
                    if (!versionsBySlug.TryGetValue(version.Slug, out var versions))
                    {
                        versions = [];
                        versionsBySlug[version.Slug] = versions;
                    }
                    versions.Add(version);

                    var parsedVersion = ParseVersion(provider.Version);
                    if (!paletteBySlug.TryGetValue(version.Slug, out var existingPalette) ||
                        parsedVersion > ParseVersion(existingPalette.VersionString))
                    {
                        paletteBySlug[version.Slug] = new WidgetPaletteDenorm(
                            provider.Version,
                            info.Category,
                            info.Icon,
                            info.Thumbnail,
                            info.BrandIds ?? [],
                            info.IsAdvanced,
                            info.SupportsHtmlEmbed);
                    }
                }
            }
            catch (Exception ex) when (ex is not InvalidOperationException)
            {
                throw new InvalidOperationException(
                    $"Failed to create IWidgetVersionProvider implementation {type.FullName}.", ex);
            }
        }

        MarkLatestVersions(versionsBySlug);

        return (versionsBySlug, paletteBySlug);
    }

    private static WidgetDefinitionVersion CreateVersionEntity(
        IWidgetVersionProvider provider,
        Type providerType,
        Dictionary<string, string> discoveredSlugVersions,
        Dictionary<Guid, string> discoveredVersionIds,
        WidgetVersionInfo info)
    {
        var slug = provider.Slug;
        var version = provider.Version;

        ValidateVersionProvider(slug, version, info.Id, providerType, discoveredSlugVersions, discoveredVersionIds);

        return new WidgetDefinitionVersion
        {
            Id = info.Id,
            Slug = slug,
            Version = version,
            Name = info.Name,
            Description = info.Description,
            ConfigSchema = info.ConfigSchema,
            DefaultConfig = info.DefaultConfig,
            DefaultStyles = info.DefaultStyles,
            ChangeLog = info.ChangeLog,
            IsLatest = false,
            IsDeprecated = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static void MarkLatestVersions(Dictionary<string, List<WidgetDefinitionVersion>> versionsBySlug)
    {
        foreach (var (_, versions) in versionsBySlug)
        {
            if (versions.Count == 0) continue;

            var latestVersion = versions
                .OrderByDescending(v => ParseVersion(v.Version))
                .First();
            latestVersion.IsLatest = true;
        }
    }

    private static List<WidgetDefinition> MergeDefinitions(
        List<WidgetDefinition> legacyDefinitions,
        Dictionary<string, List<WidgetDefinitionVersion>> versionedWidgets,
        Dictionary<string, WidgetPaletteDenorm> paletteBySlug)
    {
        var result = new List<WidgetDefinition>(legacyDefinitions);

        foreach (var (slug, versions) in versionedWidgets)
        {
            var existing = result.Find(d => d.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                result.Remove(existing);
            }

            var latestVersion = versions.FirstOrDefault(v => v.IsLatest) ?? versions.First();
            paletteBySlug.TryGetValue(slug, out var palette);
            var definition = CreateDefinitionFromVersion(slug, latestVersion, versions, palette);
            result.Add(definition);
        }

        return result;
    }

    private static WidgetDefinition CreateDefinitionFromVersion(
        string slug,
        WidgetDefinitionVersion latestVersion,
        List<WidgetDefinitionVersion> allVersions,
        WidgetPaletteDenorm? palette)
    {
        var definitionId = GenerateDefinitionId(slug);

        foreach (var v in allVersions)
        {
            v.WidgetDefinitionId = definitionId;
        }

        var icon = string.IsNullOrWhiteSpace(palette?.Icon) ? "box" : palette!.Icon;

        return new WidgetDefinition
        {
            Id = definitionId,
            Slug = slug,
            Name = latestVersion.Name,
            Description = latestVersion.Description,
            Category = palette?.Category ?? WidgetCategory.Layout,
            ConfigSchema = latestVersion.ConfigSchema,
            DefaultConfig = latestVersion.DefaultConfig,
            DefaultStyles = latestVersion.DefaultStyles,
            Version = latestVersion.Version,
            LatestVersionId = latestVersion.Id,
            Icon = icon,
            Thumbnail = palette?.Thumbnail,
            IsAdvanced = palette?.IsAdvanced ?? false,
            SupportsHtmlEmbed = palette?.SupportsHtmlEmbed ?? false,
            BrandIds = palette?.BrandIds ?? [],
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Versions = allVersions
        };
    }

    private static Guid GenerateDefinitionId(string slug)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(slug.ToLowerInvariant()));
        return new Guid(hash);
    }

    private static Version ParseVersion(string version)
    {
        return System.Version.TryParse(version, out var parsed) ? parsed : new Version(0, 0, 0);
    }

    private static void ValidateLegacyDefinition(
        WidgetDefinition definition,
        Type providerType,
        IDictionary<string, string> discoveredSlugs,
        IDictionary<Guid, string> discoveredVersionIds)
    {
        if (definition.Id == Guid.Empty)
        {
            throw new InvalidOperationException(
                $"Widget provider {providerType.FullName} returned Guid.Empty for widget Id.");
        }

        if (string.IsNullOrWhiteSpace(definition.Slug))
        {
            throw new InvalidOperationException(
                $"Widget provider {providerType.FullName} returned an empty Slug.");
        }

        if (!definition.Slug.StartsWith("widget-", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Widget provider {providerType.FullName} returned slug '{definition.Slug}'. Slugs must start with 'widget-'.");
        }

        var providerName = providerType.FullName ?? providerType.Name;
        if (discoveredVersionIds.TryGetValue(definition.Id, out var existingIdProvider))
        {
            throw new InvalidOperationException(
                $"Duplicate widget Id '{definition.Id}' detected in '{existingIdProvider}' and '{providerName}'.");
        }

        if (discoveredSlugs.TryGetValue(definition.Slug, out var existingSlugProvider))
        {
            throw new InvalidOperationException(
                $"Duplicate widget slug '{definition.Slug}' detected in '{existingSlugProvider}' and '{providerName}'.");
        }

        discoveredVersionIds[definition.Id] = providerName;
        discoveredSlugs[definition.Slug] = providerName;
    }

    private static void ValidateVersionProvider(
        string slug,
        string version,
        Guid id,
        Type providerType,
        IDictionary<string, string> discoveredSlugVersions,
        IDictionary<Guid, string> discoveredVersionIds)
    {
        if (id == Guid.Empty)
        {
            throw new InvalidOperationException(
                $"Widget version provider {providerType.FullName} returned Guid.Empty for version Id.");
        }

        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new InvalidOperationException(
                $"Widget version provider {providerType.FullName} returned an empty Slug.");
        }

        if (!slug.StartsWith("widget-", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Widget version provider {providerType.FullName} slug '{slug}' must start with 'widget-'.");
        }

        if (string.IsNullOrWhiteSpace(version))
        {
            throw new InvalidOperationException(
                $"Widget version provider {providerType.FullName} returned an empty Version.");
        }

        var providerName = providerType.FullName ?? providerType.Name;
        var slugVersionKey = $"{slug}:{version}".ToLowerInvariant();

        if (discoveredVersionIds.TryGetValue(id, out var existingIdProvider))
        {
            throw new InvalidOperationException(
                $"Duplicate version Id '{id}' detected in '{existingIdProvider}' and '{providerName}'.");
        }

        if (discoveredSlugVersions.TryGetValue(slugVersionKey, out var existingProvider))
        {
            throw new InvalidOperationException(
                $"Duplicate version '{version}' for slug '{slug}' in '{existingProvider}' and '{providerName}'.");
        }

        discoveredVersionIds[id] = providerName;
        discoveredSlugVersions[slugVersionKey] = providerName;
    }
}
