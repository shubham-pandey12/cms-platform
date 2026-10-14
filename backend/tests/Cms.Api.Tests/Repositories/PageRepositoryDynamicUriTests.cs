using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Cms.Domain.ValueObjects;
using Cms.Persistence;
using Cms.Persistence.Repositories;
using Xunit;

namespace Cms.Api.Tests.Repositories;

/// <summary>
/// Tests for <see cref="PageRepository.GetPublishedByDynamicUriAsync"/> covering the
/// <c>MatchPattern</c> logic that resolves dynamic URL patterns at request time.
/// All patterns from the CMS UI use angle-bracket syntax, e.g. /packages/&lt;SLUG&gt;.
/// The repository also understands Express-style :param and trailing * wildcard.
/// </summary>
public sealed class PageRepositoryDynamicUriTests : IDisposable
{
    private readonly CmsDbContext _context;
    private readonly PageRepository _repo;

    private static readonly Guid BrandId = Guid.NewGuid();

    public PageRepositoryDynamicUriTests()
    {
        var options = new DbContextOptionsBuilder<CmsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _context = new CmsDbContext(options);
        var cache = new MemoryCache(Microsoft.Extensions.Options.Options.Create(new MemoryCacheOptions()));
        _repo = new PageRepository(_context, cache);
    }

    public void Dispose() => _context.Dispose();

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private Page MakePage(string uri, bool isDynamic = true, PageStatus status = PageStatus.Published)
    {
        var page = new Page
        {
            Id = Guid.NewGuid(),
            BrandId = BrandId,
            Name = uri,
            Uri = uri,
            IsDynamic = isDynamic,
            DynamicVariables = [],
            Status = status,
            Seo = new PageSeo { Title = uri },
            LayoutId = Guid.NewGuid(),
            BodyContent = "[]",
            Version = "1.0.0",
            DraftRevisionId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
            UpdatedBy = Guid.NewGuid(),
        };

        _context.Pages.Add(page);
        _context.SaveChanges();

        return page;
    }

    private async Task<(Page? page, Dictionary<string, string> routeParams)> Match(string incomingUri)
        => await _repo.GetPublishedByDynamicUriAsync(BrandId, incomingUri);

    // ---------------------------------------------------------------------------
    // Angle-bracket syntax (<VAR>) — the CMS UI format
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task AngleBracketSingleParam_MatchesAndExtractsValue()
    {
        MakePage("/packages/<SLUG>");

        var (page, routeParams) = await Match("/packages/my-trip");

        Assert.NotNull(page);
        Assert.Equal("my-trip", routeParams["SLUG"]);
    }

    [Fact]
    public async Task AngleBracketMultipleParams_MatchesAndExtractsBothValues()
    {
        MakePage("/tours/<COUNTRY>/<PACKAGE_SLUG>");

        var (page, routeParams) = await Match("/tours/uk/london-highlights");

        Assert.NotNull(page);
        Assert.Equal("uk", routeParams["COUNTRY"]);
        Assert.Equal("london-highlights", routeParams["PACKAGE_SLUG"]);
    }

    [Fact]
    public async Task AngleBracketParam_LiteralPrefixMismatch_ReturnsNoMatch()
    {
        MakePage("/packages/<SLUG>");

        var (page, _) = await Match("/tours/my-trip");

        Assert.Null(page);
    }

    [Fact]
    public async Task AngleBracketParam_UriTooShort_ReturnsNoMatch()
    {
        MakePage("/packages/<COUNTRY>/<SLUG>");

        var (page, _) = await Match("/packages/uk");

        Assert.Null(page);
    }

    [Fact]
    public async Task AngleBracketParam_UriTooLong_ReturnsNoMatch()
    {
        MakePage("/packages/<SLUG>");

        var (page, _) = await Match("/packages/my-trip/extra-segment");

        Assert.Null(page);
    }

    // ---------------------------------------------------------------------------
    // Express-style :param syntax
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task ColonParamSingleParam_MatchesAndExtractsValue()
    {
        MakePage("/blog/:slug");

        var (page, routeParams) = await Match("/blog/hello-world");

        Assert.NotNull(page);
        Assert.Equal("hello-world", routeParams["slug"]);
    }

    [Fact]
    public async Task ColonParamMultipleParams_ExtractsAll()
    {
        MakePage("/blog/:year/:slug");

        var (page, routeParams) = await Match("/blog/2024/hello-world");

        Assert.NotNull(page);
        Assert.Equal("2024", routeParams["year"]);
        Assert.Equal("hello-world", routeParams["slug"]);
    }

    // ---------------------------------------------------------------------------
    // Wildcard *
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task Wildcard_MatchesRemainingSegments()
    {
        MakePage("/docs/*");

        var (page, _) = await Match("/docs/getting-started/setup");

        Assert.NotNull(page);
    }

    [Fact]
    public async Task Wildcard_MatchesSingleSegment()
    {
        MakePage("/docs/*");

        var (page, _) = await Match("/docs/intro");

        Assert.NotNull(page);
    }

    // ---------------------------------------------------------------------------
    // Literal exact match (non-dynamic path — should not be returned by the
    // dynamic query, but a dynamic page with all-literal segments would still
    // be queryable; this ensures no regression).
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task AllLiteral_ExactMatch_Matches()
    {
        MakePage("/about");

        var (page, routeParams) = await Match("/about");

        Assert.NotNull(page);
        Assert.Empty(routeParams);
    }

    [Fact]
    public async Task AllLiteral_Mismatch_ReturnsNoMatch()
    {
        MakePage("/about");

        var (page, _) = await Match("/contact");

        Assert.Null(page);
    }

    // ---------------------------------------------------------------------------
    // Specificity ordering: more specific pattern wins
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task Specificity_LiteralOverParam_PrefersLiteral()
    {
        var literal = MakePage("/packages/featured");
        MakePage("/packages/<SLUG>");

        var (page, _) = await Match("/packages/featured");

        // The literal-only match is more specific (no params) so it should be
        // preferred. Both pages are IsDynamic=true and Published in this test
        // because GetPublishedByDynamicUriAsync filters IsDynamic.
        // Specificity: literal=10 vs param=9 (1 literal * 10 - 1 param)
        Assert.NotNull(page);
        Assert.Equal(literal.Id, page.Id);
    }

    [Fact]
    public async Task Specificity_ParamOverWildcard_PrefersParam()
    {
        MakePage("/trips/*");
        var param = MakePage("/trips/<SLUG>");

        var (page, _) = await Match("/trips/paris-2024");

        Assert.NotNull(page);
        Assert.Equal(param.Id, page.Id);
    }

    // ---------------------------------------------------------------------------
    // Status filtering: only Published pages are returned
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task DraftPage_IsNotReturned()
    {
        MakePage("/packages/<SLUG>", status: PageStatus.Draft);

        var (page, _) = await Match("/packages/my-trip");

        Assert.Null(page);
    }

    // ---------------------------------------------------------------------------
    // Wrong brand: pages for other brands are not returned
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task PageForOtherBrand_IsNotReturned()
    {
        var otherBrand = new Page
        {
            Id = Guid.NewGuid(),
            BrandId = Guid.NewGuid(), // different brand
            Name = "/packages/<SLUG>",
            Uri = "/packages/<SLUG>",
            IsDynamic = true,
            DynamicVariables = [],
            Status = PageStatus.Published,
            Seo = new PageSeo { Title = "other" },
            LayoutId = Guid.NewGuid(),
            BodyContent = "[]",
            Version = "1.0.0",
            DraftRevisionId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = Guid.NewGuid(),
            UpdatedBy = Guid.NewGuid(),
        };
        _context.Pages.Add(otherBrand);
        await _context.SaveChangesAsync();

        var (page, _) = await Match("/packages/my-trip");

        Assert.Null(page);
    }

    // ---------------------------------------------------------------------------
    // Case-insensitivity
    // ---------------------------------------------------------------------------

    [Fact]
    public async Task UriMatchingIsCaseInsensitive()
    {
        MakePage("/Packages/<SLUG>");

        var (page, routeParams) = await Match("/packages/my-trip");

        Assert.NotNull(page);
        Assert.Equal("my-trip", routeParams["SLUG"]);
    }
}
