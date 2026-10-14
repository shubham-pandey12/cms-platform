using System.Globalization;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using Mapster;
using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Pages.Requests;
using Cms.Application.DTOs.Pages.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;

namespace Cms.Application.Services.Pages;

/// <summary>
/// Service for page operations.
/// </summary>
public sealed class PageService : IPageService
{
    private readonly IPageRepository _pageRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly IPageRevisionRepository _pageRevisionRepository;
    private readonly ILogger<PageService> _logger;

    public PageService(
        IPageRepository pageRepository,
        IBrandRepository brandRepository,
        IPageRevisionRepository pageRevisionRepository,
        ILogger<PageService> logger)
    {
        _pageRepository = pageRepository;
        _brandRepository = brandRepository;
        _pageRevisionRepository = pageRevisionRepository;
        _logger = logger;
    }

    public async Task<List<PageDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var pages = brandId.HasValue
            ? await _pageRepository.GetByBrandIdAsync(brandId.Value, cancellationToken)
            : await _pageRepository.GetAllAsync(cancellationToken);

        return pages.Select(p => p.Adapt<PageDto>()).ToList();
    }

    public async Task<PageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var page = await _pageRepository.GetByIdAsync(id, cancellationToken);
        return page is null ? null : page.Adapt<PageDto>();
    }

    public async Task<PageDto?> GetByUriAsync(string brandIdOrSlug, string uri, CancellationToken cancellationToken = default)
    {
        Guid? resolvedBrandId = null;
        if (Guid.TryParse(brandIdOrSlug, out var parsedId))
        {
            resolvedBrandId = parsedId;
        }
        else
        {
            var brand = await _brandRepository.GetBySubdomainAsync(brandIdOrSlug, cancellationToken);
            resolvedBrandId = brand?.Id;
        }

        if (resolvedBrandId is null)
        {
            return null;
        }

        // Try exact match first
        var page = await _pageRepository.GetPublishedByUriAsync(resolvedBrandId.Value, uri, cancellationToken);
        if (page is not null)
        {
            return await BuildPublicPageDtoAsync(page, new Dictionary<string, string>(), cancellationToken);
        }

        // Fallback to dynamic match
        var dynamicMatch = await _pageRepository.GetPublishedByDynamicUriAsync(resolvedBrandId.Value, uri, cancellationToken);
        if (dynamicMatch.page is not null)
        {
            return await BuildPublicPageDtoAsync(dynamicMatch.page, dynamicMatch.routeParams, cancellationToken);
        }

        return null;
    }

    /// <summary>
    /// Builds the DTO for public consumption. When the page is published and has a published revision,
    /// returns content from that revision so the live site shows the selected version.
    /// </summary>
    private async Task<PageDto> BuildPublicPageDtoAsync(Page page, Dictionary<string, string> routeParams, CancellationToken cancellationToken)
    {
        var dto = page.Adapt<PageDto>() with { RouteParams = routeParams };

        if (page.Status != PageStatus.Published || page.PublishedRevisionId is null)
        {
            return dto;
        }

        var revision = await _pageRevisionRepository.GetByIdAsync(page.PublishedRevisionId.Value, cancellationToken);
        if (revision is null)
        {
            return dto;
        }

        return dto with
        {
            BodyContent = revision.LayoutData,
            Seo = revision.Seo.Adapt<PageSeoDto>(),
            ThemeId = revision.ThemeId,
            LayoutConfigJson = revision.LayoutConfigJson,
            CustomCss = revision.CustomCss
        };
    }

    public async Task<PageDto> CreateAsync(CreatePageRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var existingWithUri = await _pageRepository.GetByUriAsync(request.BrandId, request.Uri, cancellationToken);
        if (existingWithUri is not null)
            throw new InvalidOperationException($"A page with URI '{request.Uri}' already exists for this brand.");

        var page = new Page
        {
            BrandId = request.BrandId,
            Name = request.Name,
            Uri = request.Uri,
            IsDynamic = request.IsDynamic,
            DynamicVariables = request.DynamicVariables ?? [],
            Status = PageStatus.Draft,
            Seo = request.Seo is not null ? new PageSeo
            {
                Title = request.Seo.Title,
                Description = request.Seo.Description,
                Keywords = request.Seo.Keywords,
                CanonicalUrl = request.Seo.CanonicalUrl,
                OgTitle = request.Seo.OgTitle,
                OgDescription = request.Seo.OgDescription,
                OgImage = request.Seo.OgImage,
                NoIndex = request.Seo.NoIndex,
                NoFollow = request.Seo.NoFollow
            } : new PageSeo { Title = request.Name, Description = "" },
            LayoutId = request.LayoutId,
            BodyContent = request.BodyContent ?? "[]",
            ThemeId = request.ThemeId,
            Version = "1.0.0",
            DraftRevisionId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = userId,
            UpdatedBy = userId
        };

        await _pageRepository.AddAsync(page, cancellationToken);
        await _pageRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Page created. PageId={PageId}, BrandId={BrandId}, Uri={Uri}, UserId={UserId}",
            page.Id,
            page.BrandId,
            page.Uri,
            userId);

        return page.Adapt<PageDto>();
    }

    public async Task<PageDto> UpdateAsync(Guid id, UpdatePageRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var page = await _pageRepository.GetByIdAsync(id, cancellationToken);
        if (page is null)
        {
            throw new KeyNotFoundException($"Page with id {id} not found");
        }

        if (request.Name is not null) page.Name = request.Name;
        if (request.Uri is not null)
        {
            if (!string.Equals(request.Uri, page.Uri, StringComparison.OrdinalIgnoreCase))
            {
                var existingWithUri = await _pageRepository.GetByUriAsync(page.BrandId, request.Uri, cancellationToken);
                if (existingWithUri is not null && existingWithUri.Id != id)
                    throw new InvalidOperationException($"A page with URI '{request.Uri}' already exists for this brand.");
            }
            page.Uri = request.Uri;
        }
        if (request.IsDynamic.HasValue) page.IsDynamic = request.IsDynamic.Value;
        if (request.DynamicVariables is not null) page.DynamicVariables = request.DynamicVariables;
        if (request.Seo is not null)
        {
            page.Seo = new PageSeo
            {
                Title = request.Seo.Title,
                Description = request.Seo.Description,
                Keywords = request.Seo.Keywords,
                CanonicalUrl = request.Seo.CanonicalUrl,
                OgTitle = request.Seo.OgTitle,
                OgDescription = request.Seo.OgDescription,
                OgImage = request.Seo.OgImage,
                NoIndex = request.Seo.NoIndex,
                NoFollow = request.Seo.NoFollow
            };
        }
        if (request.BodyContent is not null) page.BodyContent = request.BodyContent;
        if (request.ThemeId.HasValue) page.ThemeId = request.ThemeId;
        if (request.LayoutConfigJson is not null) page.LayoutConfigJson = request.LayoutConfigJson;
        if (request.CustomCss is not null) page.CustomCss = request.CustomCss;

        page.UpdatedAt = DateTime.UtcNow;
        page.UpdatedBy = userId;

        await _pageRepository.UpdateAsync(page, cancellationToken);
        await _pageRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Page updated. PageId={PageId}, BrandId={BrandId}, UserId={UserId}",
            page.Id,
            page.BrandId,
            userId);

        return page.Adapt<PageDto>();
    }

    public async Task<List<PageRevisionDto>> GetRevisionsAsync(Guid pageId, CancellationToken cancellationToken = default)
    {
        var page = await _pageRepository.GetByIdAsync(pageId, cancellationToken);
        if (page is null)
        {
            throw new KeyNotFoundException($"Page with id {pageId} not found");
        }

        var revisions = await _pageRevisionRepository.GetByPageIdAsync(pageId, cancellationToken);
        return revisions.Select(r => new PageRevisionDto(r.Id, r.PageId, r.CreatedAt, r.CreatedBy)).ToList();
    }

    /// <summary>
    /// Gets a single revision's full content for loading into the editor. Returns null if revision not found or does not belong to the page.
    /// </summary>
    public async Task<PageRevisionDetailDto?> GetRevisionByIdAsync(Guid pageId, Guid revisionId, CancellationToken cancellationToken = default)
    {
        var revision = await _pageRevisionRepository.GetByIdAsync(revisionId, cancellationToken);
        if (revision is null || revision.PageId != pageId)
        {
            return null;
        }

        return new PageRevisionDetailDto(
            revision.Id,
            revision.PageId,
            revision.LayoutData,
            revision.Seo.Adapt<PageSeoDto>(),
            revision.ThemeId,
            revision.LayoutConfigJson,
            revision.CustomCss,
            revision.CreatedAt,
            revision.CreatedBy);
    }

    public async Task<PageDto> PublishAsync(Guid id, PublishPageRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Version);

        if (!System.Version.TryParse(request.Version, out _))
        {
            throw new ArgumentException($"Invalid version format: '{request.Version}'. Use semantic version (e.g. 1.0.0).", nameof(request));
        }

        var page = await _pageRepository.GetByIdAsync(id, cancellationToken);
        if (page is null)
        {
            throw new KeyNotFoundException($"Page with id {id} not found");
        }

        if (request.RevisionId.HasValue)
        {
            var revision = await _pageRevisionRepository.GetByIdAsync(request.RevisionId.Value, cancellationToken);
            if (revision is null || revision.PageId != page.Id)
            {
                throw new ArgumentException($"Revision {request.RevisionId} not found or does not belong to page {id}.", nameof(request));
            }

            page.PublishedRevisionId = revision.Id;
            page.Version = request.Version;
            page.Status = PageStatus.Published;
            page.PublishedAt = DateTime.UtcNow;
            page.UpdatedAt = DateTime.UtcNow;
            page.UpdatedBy = userId;

            await _pageRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation(
                "Page published from existing revision. PageId={PageId}, BrandId={BrandId}, Version={Version}, RevisionId={RevisionId}, UserId={UserId}",
                page.Id,
                page.BrandId,
                page.Version,
                page.PublishedRevisionId,
                userId);

            return page.Adapt<PageDto>();
        }

        page.Version = request.Version;

        var newRevision = new PageRevision
        {
            PageId = page.Id,
            LayoutData = page.BodyContent,
            Seo = page.Seo,
            ThemeId = page.ThemeId,
            LayoutConfigJson = page.LayoutConfigJson,
            CustomCss = page.CustomCss,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        await _pageRevisionRepository.AddAsync(newRevision, cancellationToken);

        page.Status = PageStatus.Published;
        page.PublishedRevisionId = newRevision.Id;
        page.PublishedAt = DateTime.UtcNow;
        page.UpdatedAt = DateTime.UtcNow;
        page.UpdatedBy = userId;

        await _pageRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Page published with new revision. PageId={PageId}, BrandId={BrandId}, Version={Version}, RevisionId={RevisionId}, UserId={UserId}",
            page.Id,
            page.BrandId,
            page.Version,
            newRevision.Id,
            userId);

        return page.Adapt<PageDto>();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var page = await _pageRepository.GetByIdAsync(id, cancellationToken);
        if (page is null)
        {
            throw new KeyNotFoundException($"Page with id {id} not found");
        }

        await _pageRepository.DeleteAsync(page, cancellationToken);
        await _pageRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Page deleted. PageId={PageId}, BrandId={BrandId}",
            id,
            page.BrandId);
    }

    /// <inheritdoc />
    public async Task<string> GetSitemapXmlAsync(Guid brandId, string absoluteBaseUrl, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(absoluteBaseUrl);

        var pages = await _pageRepository.GetPublishedStaticSitemapPagesAsync(brandId, cancellationToken);
        _logger.LogInformation(
            "Sitemap generated. BrandId={BrandId}, PageCount={PageCount}, BaseUrl={BaseUrl}",
            brandId,
            pages.Count,
            absoluteBaseUrl);

        var ns = XNamespace.Get("http://www.sitemaps.org/schemas/sitemap/0.9");
        var urlElements = pages.Select(p =>
        {
            var loc = CombineSitemapLoc(absoluteBaseUrl, p.Uri);
            var lastMod = (p.PublishedAt ?? p.UpdatedAt).ToUniversalTime();
            var lastModStr = lastMod.ToString("yyyy-MM-ddTHH:mm:ss'Z'", CultureInfo.InvariantCulture);
            return new XElement(
                ns + "url",
                new XElement(ns + "loc", loc),
                new XElement(ns + "lastmod", lastModStr));
        });

        var doc = new XDocument(new XDeclaration("1.0", "utf-8", null), new XElement(ns + "urlset", urlElements));
        var settings = new XmlWriterSettings { Indent = true, OmitXmlDeclaration = false, Encoding = new UTF8Encoding(false), Async = false };
        using var stream = new MemoryStream();
        using (var writer = XmlWriter.Create(stream, settings))
        {
            doc.Save(writer);
        }

        return Encoding.UTF8.GetString(stream.ToArray());
    }

    private static string CombineSitemapLoc(string absoluteBaseUrl, string pageUri)
    {
        var baseTrimmed = absoluteBaseUrl.Trim().TrimEnd('/');
        var path = string.IsNullOrWhiteSpace(pageUri) ? "/" : pageUri.Trim();
        if (!path.StartsWith('/'))
        {
            path = "/" + path;
        }

        return path == "/" ? baseTrimmed + "/" : baseTrimmed + path;
    }
}

