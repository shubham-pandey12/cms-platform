using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.DTOs.AuditLogs;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class AuditLogsControllerTests
{
    [Fact]
    public async Task GetAll_ReturnsOkWithLogs()
    {
        var logs = new List<AuditLogDto>
        {
            new(Guid.NewGuid(), Guid.NewGuid(), "a", AuditEntityType.Page, Guid.NewGuid(), "{}", DateTime.UtcNow),
        };
        var mock = new Mock<IAuditLogService>();
        mock
            .Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<AuditEntityType?>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(logs);

        var sut = new AuditLogsController(mock.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, null, 50, 0, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(logs, ok.Value);
    }
}
