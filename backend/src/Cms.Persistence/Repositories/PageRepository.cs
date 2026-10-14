using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Cms.Application.Interfaces.Repositories;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Persistence.Repositories;

/// <summary>
/// Repository implementation for Page entity.
/// </summary>
public class PageRepository : Repository<Page>, IPageRepository
{
    private readonly IMemoryCache _cache;

    /// <summary>Duration for which the per-brand dynamic-page candidate list is cached.</summary>
    private static readonly TimeSpan DynamicPageCacheTtl = TimeSpan.FromSeconds(30);

    private static string DynamicPageCacheKey(Guid brandId) => $"dynamic_pages_{brandId}";

    public PageRepository(CmsDbContext context, IMemoryCache cache) : base(context)
    {
        _cache = cache;
    }

    /// <summary>Removes the cached dynamic-page candidate list for a brand after a write.</summary>
    private void EvictDynamicCache(Guid brandId) =>
        _cache.Remove(DynamicPageCacheKey(brandId));

    public override Task<Page> AddAsync(Page entity, CancellationToken cancellationToken = default)
    {
        EvictDynamicCache(entity.BrandId);
        return base.AddAsync(entity, cancellationToken);
    }

    public override Task UpdateAsync(Page entity, CancellationToken cancellationToken = default)
    {
        EvictDynamicCache(entity.BrandId);
        return base.UpdateAsync(entity, cancellationToken);
    }

    public override Task DeleteAsync(Page entity, CancellationToken cancellationToken = default)
    {
        EvictDynamicCache(entity.BrandId);
        return base.DeleteAsync(entity, cancellationToken);
    }

    public async Task<Page?> GetByUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default)
    {
        var normalizedUri = uri.ToLowerInvariant().TrimEnd('/');
        if (string.IsNullOrEmpty(normalizedUri)) normalizedUri = "/";

        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.BrandId == brandId && p.Uri.ToLower() == normalizedUri, cancellationToken);
    }

    public async Task<List<Page>> GetByBrandIdAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(p => p.BrandId == brandId)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Page?> GetPublishedByUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default)
    {
        var normalizedUri = uri.ToLowerInvariant().TrimEnd('/');
        if (string.IsNullOrEmpty(normalizedUri)) normalizedUri = "/";

        return await DbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.BrandId == brandId &&
                     p.Uri.ToLower() == normalizedUri &&
                     p.Status == PageStatus.Published,
                cancellationToken);
    }

    /// <summary>
    /// Attempts to match a published page using dynamic patterns like /blog/:slug or /trips/*.
    /// Returns the matched page and extracted route params.
    /// The candidate list for each brand is cached for <see cref="DynamicPageCacheTtl"/> to avoid
    /// a full table scan on every request.
    /// </summary>
    public async Task<(Page? page, Dictionary<string, string> routeParams)> GetPublishedByDynamicUriAsync(Guid brandId, string uri, CancellationToken cancellationToken = default)
    {
        var normalizedUri = NormalizeUri(uri);

        var cacheKey = DynamicPageCacheKey(brandId);
        if (!_cache.TryGetValue(cacheKey, out List<Page>? candidates) || candidates is null)
        {
            candidates = await DbSet
                .AsNoTracking()
                .Where(p => p.BrandId == brandId && p.Status == PageStatus.Published && p.IsDynamic)
                .ToListAsync(cancellationToken);

            _cache.Set(cacheKey, candidates, DynamicPageCacheTtl);
        }

        // Prioritize more specific patterns: fewer wildcards, more segments
        var ordered = candidates
            .Select(p => new { Page = p, Match = MatchPattern(p.Uri, normalizedUri) })
            .Where(x => x.Match.IsMatch)
            .OrderByDescending(x => x.Match.Specificity)
            .FirstOrDefault();

        if (ordered is null)
        {
            return (null, new Dictionary<string, string>());
        }

        return (ordered.Page, ordered.Match.RouteParams);
    }

    /// <inheritdoc />
    public async Task<List<Page>> GetPublishedStaticSitemapPagesAsync(Guid brandId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Where(p =>
                p.BrandId == brandId &&
                p.Status == PageStatus.Published &&
                !p.IsDynamic &&
                !p.Seo.NoIndex)
            .OrderBy(p => p.Uri)
            .ToListAsync(cancellationToken);
    }

    private static string NormalizeUri(string uri)
    {
        var normalized = uri.ToLowerInvariant().TrimEnd('/');
        return string.IsNullOrEmpty(normalized) ? "/" : normalized;
    }

    private sealed class MatchResult
    {
        public bool IsMatch { get; set; }
        public int Specificity { get; set; }
        public Dictionary<string, string> RouteParams { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    // Supports segments with :param, <PARAM> (angle-bracket UI syntax), and trailing * wildcard.
    private static MatchResult MatchPattern(string pattern, string uri)
    {
        var result = new MatchResult { IsMatch = false, Specificity = 0 };
        var normPattern = NormalizeUri(pattern);
        var normUri = NormalizeUri(uri);

        var patternSegments = normPattern.Split('/', StringSplitOptions.RemoveEmptyEntries);
        var uriSegments = normUri.Split('/', StringSplitOptions.RemoveEmptyEntries);

        var routeParams = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        int i = 0;
        for (; i < patternSegments.Length; i++)
        {
            var segment = patternSegments[i];

            if (segment == "*")
            {
                // wildcard matches remaining segments
                result.IsMatch = true;
                result.Specificity = patternSegments.Length - 1; // less specific than named params
                result.RouteParams = routeParams;
                return result;
            }

            if (i >= uriSegments.Length)
            {
                return result; // pattern longer than uri
            }

            if (segment.StartsWith(":"))
            {
                // Express-style :param syntax
                var key = segment.TrimStart(':');
                routeParams[key] = uriSegments[i];
                continue;
            }

            if (segment.StartsWith("<") && segment.EndsWith(">") && segment.Length > 2)
            {
                // Angle-bracket syntax used by the CMS UI, e.g. <PACKAGE_SLUG>
                var key = segment[1..^1];
                routeParams[key] = uriSegments[i];
                continue;
            }

            if (!string.Equals(segment, uriSegments[i], StringComparison.OrdinalIgnoreCase))
            {
                return result; // literal mismatch
            }
        }

        if (i != uriSegments.Length)
        {
            return result; // uri has extra segments with no wildcard
        }

        // Higher specificity for fewer params/wildcards
        var literals = patternSegments.Count(s => !s.StartsWith(":") && s != "*" && !(s.StartsWith("<") && s.EndsWith(">") && s.Length > 2));
        var paramsCount = patternSegments.Count(s => s.StartsWith(":") || (s.StartsWith("<") && s.EndsWith(">") && s.Length > 2));
        result.IsMatch = true;
        result.Specificity = (literals * 10) - paramsCount;
        result.RouteParams = routeParams;
        return result;
    }
}

