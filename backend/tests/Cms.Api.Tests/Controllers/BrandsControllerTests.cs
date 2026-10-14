using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.Brands.Requests;
using Cms.Application.DTOs.Brands.Responses;
using Cms.Application.DTOs.SiteSettings;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class BrandsControllerTests
{
    private static BrandDto SampleBrand(Guid? id = null)
    {
        var bid = id ?? Guid.NewGuid();
        var now = DateTime.UtcNow;
        return new BrandDto(
            bid,
            "Acme",
            "acme.com",
            "shop",
            null,
            "#111111",
            "#222222",
            null,
            [],
            now,
            now);
    }

    private static BrandsController CreateController(
        IBrandService service,
        Action<DefaultHttpContext>? configureHttp = null,
        ClaimsPrincipal? user = null,
        IPageService? pageService = null,
        ISiteSettingsService? siteSettingsService = null)
    {
        var httpContext = new DefaultHttpContext();
        configureHttp?.Invoke(httpContext);
        if (user is not null)
            httpContext.User = user;

        return new BrandsController(
            service,
            pageService ?? new Mock<IPageService>().Object,
            siteSettingsService ?? new Mock<ISiteSettingsService>().Object)
        {
            ControllerContext = new ControllerContext { HttpContext = httpContext },
        };
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithBrandsFromService()
    {
        var expected = new List<BrandDto> { SampleBrand() };
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var sut = CreateController(mock.Object);
        var result = await sut.GetAll(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(expected, ok.Value);
    }

    [Fact]
    public async Task CheckAvailability_ReturnsOkWithResponse()
    {
        var availability = new BrandAvailabilityResponse(true, false);
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.CheckAvailabilityAsync("a.com", "sub", It.IsAny<Guid?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(availability);

        var sut = CreateController(mock.Object);
        var result = await sut.CheckAvailability("a.com", "sub", Guid.NewGuid(), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(availability, ok.Value);
    }

    [Fact]
    public async Task GetByHost_WhenResolvedHostIsEmpty_ReturnsNotFound()
    {
        var mock = new Mock<IBrandService>();
        var sut = CreateController(mock.Object, ctx => { ctx.Request.Host = new HostString(""); });

        var result = await sut.GetByHost(host: null, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
        mock.Verify(s => s.GetByHostAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetByHost_WhenBrandNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetByHostAsync("missing.example", It.IsAny<CancellationToken>())).ReturnsAsync((BrandDto?)null);

        var sut = CreateController(mock.Object);
        var result = await sut.GetByHost("missing.example", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetByHost_WhenBrandExists_ReturnsOk()
    {
        var brand = SampleBrand();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetByHostAsync("app.example.com", It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        var sut = CreateController(mock.Object);
        var result = await sut.GetByHost("app.example.com", CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(brand, ok.Value);
    }

    [Fact]
    public async Task GetSitemapXml_WhenBrandNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetByIdOrSlugAsync(id.ToString(), It.IsAny<CancellationToken>())).ReturnsAsync((BrandDto?)null);

        var sut = CreateController(mock.Object);
        var result = await sut.GetSitemapXml(id.ToString(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetSitemapXml_WhenBrandExists_UsesRequestHostAndReturnsXml()
    {
        var brand = SampleBrand();
        var mockBrand = new Mock<IBrandService>();
        mockBrand.Setup(s => s.GetByIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        const string expectedXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><urlset />";
        var mockPage = new Mock<IPageService>();
        mockPage
            .Setup(s => s.GetSitemapXmlAsync(brand.Id, "https://example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedXml);

        var mockSite = new Mock<ISiteSettingsService>();
        mockSite
            .Setup(s => s.GetByBrandIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SiteSettingsDto?)null);

        var sut = CreateController(
            mockBrand.Object,
            ctx =>
            {
                ctx.Request.Scheme = "https";
                ctx.Request.Host = new HostString("example.com");
            },
            pageService: mockPage.Object,
            siteSettingsService: mockSite.Object);

        var result = await sut.GetSitemapXml(brand.Id.ToString(), CancellationToken.None);

        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal("application/xml", content.ContentType);
        Assert.Equal(expectedXml, content.Content);
        mockPage.Verify(s => s.GetSitemapXmlAsync(brand.Id, "https://example.com", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSitemapXml_WhenHostSegment_ResolvesViaGetByHostAndReturnsXml()
    {
        var brand = SampleBrand();
        const string hostSegment = "example.com";
        var mockBrand = new Mock<IBrandService>();
        mockBrand.Setup(s => s.GetByIdOrSlugAsync(hostSegment, It.IsAny<CancellationToken>())).ReturnsAsync((BrandDto?)null);
        mockBrand.Setup(s => s.GetByHostAsync(hostSegment, It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        const string expectedXml = "<?xml version=\"1.0\" encoding=\"utf-8\"?><urlset />";
        var mockPage = new Mock<IPageService>();
        mockPage
            .Setup(s => s.GetSitemapXmlAsync(brand.Id, "https://example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedXml);

        var mockSite = new Mock<ISiteSettingsService>();
        mockSite
            .Setup(s => s.GetByBrandIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((SiteSettingsDto?)null);

        var sut = CreateController(
            mockBrand.Object,
            ctx =>
            {
                ctx.Request.Scheme = "https";
                ctx.Request.Host = new HostString(hostSegment);
            },
            pageService: mockPage.Object,
            siteSettingsService: mockSite.Object);

        var result = await sut.GetSitemapXml(hostSegment, CancellationToken.None);

        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal(expectedXml, content.Content);
        mockBrand.Verify(s => s.GetByHostAsync(hostSegment, It.IsAny<CancellationToken>()), Times.Once);
        mockPage.Verify(s => s.GetSitemapXmlAsync(brand.Id, "https://example.com", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSitemapXml_WhenCanonicalUrlSet_PassesTrimmedCanonicalToPageService()
    {
        var brand = SampleBrand();
        var mockBrand = new Mock<IBrandService>();
        mockBrand.Setup(s => s.GetByIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        const string expectedXml = "<root />";
        var mockPage = new Mock<IPageService>();
        mockPage
            .Setup(s => s.GetSitemapXmlAsync(brand.Id, "https://shop.example", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedXml);

        var mockSite = new Mock<ISiteSettingsService>();
        var dto = new SiteSettingsDto(
            Guid.NewGuid(),
            brand.Id,
            "Site",
            "",
            "",
            "",
            true,
            "top",
            "standard",
            true,
            "",
            false,
            "",
            "",
            false,
            "",
            "",
            "User-agent: *",
            "https://shop.example/",
            null,
            null,
            null,
            null,
            DateTime.UtcNow);
        mockSite
            .Setup(s => s.GetByBrandIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(dto);

        var sut = CreateController(mockBrand.Object, pageService: mockPage.Object, siteSettingsService: mockSite.Object);

        var result = await sut.GetSitemapXml(brand.Id.ToString(), CancellationToken.None);

        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal(expectedXml, content.Content);
        mockPage.Verify(s => s.GetSitemapXmlAsync(brand.Id, "https://shop.example", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_WhenBrandNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetByIdOrSlugAsync("nope", It.IsAny<CancellationToken>())).ReturnsAsync((BrandDto?)null);

        var sut = CreateController(mock.Object);
        var result = await sut.GetById("nope", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetById_WhenBrandExists_ReturnsOk()
    {
        var brand = SampleBrand();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetByIdOrSlugAsync(brand.Id.ToString(), It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        var sut = CreateController(mock.Object);
        var result = await sut.GetById(brand.Id.ToString(), CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(brand, ok.Value);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtActionWithBrand()
    {
        var brand = SampleBrand();
        var request = new CreateBrandRequest(
            "Acme",
            "acme.com",
            null,
            null,
            "#fff",
            "#000",
            null,
            null);
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.CreateAsync(request, null, It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        var sut = CreateController(mock.Object);
        var result = await sut.Create(request, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(BrandsController.GetById), created.ActionName);
        Assert.Equal(brand.Id, created.RouteValues!["idOrSlug"]);
        Assert.Same(brand, created.Value);
    }

    [Fact]
    public async Task Create_WhenUserHasNameIdentifier_PassesCreatedByToService()
    {
        var userId = Guid.NewGuid();
        var brand = SampleBrand();
        var request = new CreateBrandRequest(
            "Acme",
            "acme.com",
            null,
            null,
            "#fff",
            "#000",
            null,
            null);
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.CreateAsync(request, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(brand);

        var user = new ClaimsPrincipal(new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            authenticationType: "Test"));
        var sut = CreateController(mock.Object, user: user);

        await sut.Create(request, CancellationToken.None);

        mock.Verify(s => s.CreateAsync(request, userId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_ReturnsOkWithBrand()
    {
        var id = Guid.NewGuid();
        var brand = SampleBrand(id);
        var request = new UpdateBrandRequest("N", null, null, null, null, null, null, null);
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.UpdateAsync(id, request, It.IsAny<CancellationToken>())).ReturnsAsync(brand);

        var sut = CreateController(mock.Object);
        var result = await sut.Update(id, request, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(brand, ok.Value);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.DeleteAsync(id, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateController(mock.Object);
        var result = await sut.Delete(id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task GetDomains_WhenFound_ReturnsOkWithList()
    {
        var id = Guid.NewGuid();
        var domains = new List<string> { "a.com", "b.com" };
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.GetDomainsAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(domains);

        var sut = CreateController(mock.Object);
        var result = await sut.GetDomains(id, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(domains, ok.Value);
    }

    [Fact]
    public async Task GetDomains_WhenKeyNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.GetDomainsAsync(id, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException());

        var sut = CreateController(mock.Object);
        var result = await sut.GetDomains(id, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task AddDomain_WhenDomainMissing_ReturnsBadRequest()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        var sut = CreateController(mock.Object);

        var result = await sut.AddDomain(id, new AddBrandDomainRequest("   "), CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Domain is required.", bad.Value);
        mock.Verify(s => s.AddDomainAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AddDomain_WhenRequestNull_ReturnsBadRequest()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        var sut = CreateController(mock.Object);

        var result = await sut.AddDomain(id, null!, CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("Domain is required.", bad.Value);
        mock.Verify(s => s.AddDomainAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AddDomain_WhenSuccess_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.AddDomainAsync(id, "new.com", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateController(mock.Object);
        var result = await sut.AddDomain(id, new AddBrandDomainRequest("new.com"), CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task AddDomain_WhenKeyNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.AddDomainAsync(id, "x.com", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException());

        var sut = CreateController(mock.Object);
        var result = await sut.AddDomain(id, new AddBrandDomainRequest("x.com"), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task AddDomain_WhenArgumentException_ReturnsBadRequestWithMessage()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.AddDomainAsync(id, "bad", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("invalid domain"));

        var sut = CreateController(mock.Object);
        var result = await sut.AddDomain(id, new AddBrandDomainRequest("bad"), CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("invalid domain", bad.Value);
    }

    [Fact]
    public async Task AddDomain_WhenInvalidOperation_ReturnsBadRequestWithMessage()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.AddDomainAsync(id, "dup.com", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("duplicate"));

        var sut = CreateController(mock.Object);
        var result = await sut.AddDomain(id, new AddBrandDomainRequest("dup.com"), CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("duplicate", bad.Value);
    }

    [Fact]
    public async Task RemoveDomain_WhenSuccess_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock.Setup(s => s.RemoveDomainAsync(id, "old.com", It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateController(mock.Object);
        var result = await sut.RemoveDomain(id, "old.com", CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task RemoveDomain_WhenKeyNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.RemoveDomainAsync(id, "gone.com", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException());

        var sut = CreateController(mock.Object);
        var result = await sut.RemoveDomain(id, "gone.com", CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task RemoveDomain_WhenInvalidOperation_ReturnsBadRequestWithMessage()
    {
        var id = Guid.NewGuid();
        var mock = new Mock<IBrandService>();
        mock
            .Setup(s => s.RemoveDomainAsync(id, "primary.com", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("cannot remove primary"));

        var sut = CreateController(mock.Object);
        var result = await sut.RemoveDomain(id, "primary.com", CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("cannot remove primary", bad.Value);
    }
}
