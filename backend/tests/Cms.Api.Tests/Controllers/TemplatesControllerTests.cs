using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Api.Tests.TestHelpers;
using Cms.Application.DTOs.Templates.Requests;
using Cms.Application.DTOs.Templates.Responses;
using Cms.Application.Interfaces.Services;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class TemplatesControllerTests
{
    private static TemplateDto SampleTemplate(Guid? id = null)
    {
        var tid = id ?? Guid.NewGuid();
        return new TemplateDto(tid, "T", "d", null, "<p/>", null, null, DateTime.UtcNow, DateTime.UtcNow, Guid.NewGuid());
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var list = new List<TemplateDto> { SampleTemplate() };
        var mock = new Mock<ITemplateService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(list);

        var sut = new TemplatesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var userId = Guid.NewGuid();
        var template = SampleTemplate();
        var req = new CreateTemplateRequest("T", "d", null, "<p/>", null, null);
        var mock = new Mock<ITemplateService>();
        mock.Setup(s => s.CreateAsync(req, userId, It.IsAny<CancellationToken>())).ReturnsAsync(template);

        var sut = new TemplatesController(mock.Object)
        {
            ControllerContext = ControllerTestContext.Create(user: ControllerTestContext.UserWithId(userId)),
        };

        var result = await sut.Create(req, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(TemplatesController.GetAll), created.ActionName);
        Assert.Equal(template.Id, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound()
    {
        var req = new UpdateTemplateRequest(null, null, null, null, null);
        var mock = new Mock<ITemplateService>();
        mock.Setup(s => s.UpdateAsync(It.IsAny<Guid>(), req, It.IsAny<CancellationToken>())).ReturnsAsync((TemplateDto?)null);

        var sut = new TemplatesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(Guid.NewGuid(), req, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenFound_ReturnsOk()
    {
        var t = SampleTemplate();
        var req = new UpdateTemplateRequest("N", null, null, null, null);
        var mock = new Mock<ITemplateService>();
        mock.Setup(s => s.UpdateAsync(t.Id, req, It.IsAny<CancellationToken>())).ReturnsAsync(t);

        var sut = new TemplatesController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.Update(t.Id, req, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(t, ok.Value);
    }
}
