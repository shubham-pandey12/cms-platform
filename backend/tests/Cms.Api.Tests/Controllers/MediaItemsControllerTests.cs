using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Cms.Api.Controllers;
using Cms.Application.Common.Interfaces;
using Cms.Application.DTOs.Media.Requests;
using Cms.Application.DTOs.Media.Responses;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Api.Tests.Controllers;

public sealed class MediaItemsControllerTests
{
    private static MediaItemDto SampleItem(Guid? id = null)
    {
        var mid = id ?? Guid.NewGuid();
        return new MediaItemDto(
            mid,
            "f.png",
            "https://x/f",
            "https://x/f",
            MediaType.Image,
            10,
            Guid.NewGuid(),
            "lib",
            null,
            Guid.NewGuid(),
            DateTime.UtcNow,
            MediaStorageProvider.Database);
    }

    [Fact]
    public async Task GetAll_ReturnsOk()
    {
        var list = new List<MediaItemDto> { SampleItem() };
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.GetAllAsync(It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(list);
        var cur = new Mock<ICurrentUser>();

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetAll(null, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(list, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((MediaItemDto?)null);
        var cur = new Mock<ICurrentUser>();

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetById(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetFile_WhenFound_ReturnsFile()
    {
        var id = Guid.NewGuid();
        var bytes = new byte[] { 1, 2, 3 };
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.GetFileAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(new MediaFileResult.Found(bytes, "image/png"));
        var cur = new Mock<ICurrentUser>();

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFile(id, CancellationToken.None);

        var file = Assert.IsType<FileContentResult>(result);
        Assert.Equal(bytes, file.FileContents);
    }

    [Fact]
    public async Task GetFile_WhenNotFound_ReturnsNotFound()
    {
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.GetFileAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(new MediaFileResult.NotFound());
        var cur = new Mock<ICurrentUser>();

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFile(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task GetFile_WhenBlobNotImplemented_Returns501()
    {
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.GetFileAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(new MediaFileResult.BlobNotImplemented());
        var cur = new Mock<ICurrentUser>();

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() } };
        var result = await sut.GetFile(Guid.NewGuid(), CancellationToken.None);

        var status = Assert.IsType<StatusCodeResult>(result);
        Assert.Equal(501, status.StatusCode);
    }

    [Fact]
    public async Task Upload_WhenNoFile_ReturnsBadRequest()
    {
        var mock = new Mock<IMediaService>();
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(Guid.NewGuid());

        var sut = new MediaItemsController(mock.Object, cur.Object)
        {
            ControllerContext = new() { HttpContext = new DefaultHttpContext() },
        };

        var result = await sut.Upload(new UploadMediaRequest { File = null, BrandId = Guid.NewGuid() }, CancellationToken.None);

        var bad = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.NotNull(bad.Value);
        mock.Verify(s => s.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Upload_WhenUserIdNull_ReturnsUnauthorized()
    {
        await using var stream = new MemoryStream([1, 2]);
        var formFile = new FormFile(stream, 0, 2, "file", "a.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        var mock = new Mock<IMediaService>();
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns((Guid?)null);

        var http = new DefaultHttpContext();
        http.Request.Scheme = "https";
        http.Request.Host = new HostString("localhost:5001");

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = http } };

        var result = await sut.Upload(
            new UploadMediaRequest { File = formFile, BrandId = Guid.NewGuid(), Folder = "f" },
            CancellationToken.None);

        Assert.IsType<UnauthorizedResult>(result.Result);
        mock.Verify(s => s.UploadAsync(It.IsAny<UploadMediaRequest>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Upload_WhenSuccess_ReturnsCreated()
    {
        var userId = Guid.NewGuid();
        var item = SampleItem();
        await using var stream = new MemoryStream([1, 2]);
        var formFile = new FormFile(stream, 0, 2, "file", "a.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        var request = new UploadMediaRequest { File = formFile, BrandId = Guid.NewGuid(), Folder = "f" };

        var mock = new Mock<IMediaService>();
        mock
            .Setup(s => s.UploadAsync(request, userId, "https://localhost:5001", It.IsAny<CancellationToken>()))
            .ReturnsAsync(item);

        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);

        var http = new DefaultHttpContext();
        http.Request.Scheme = "https";
        http.Request.Host = new HostString("localhost:5001");

        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = http } };

        var result = await sut.Upload(request, CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(MediaItemsController.GetById), created.ActionName);
        Assert.Equal(item.Id, created.RouteValues!["id"]);
    }

    [Fact]
    public async Task Upload_WhenForbidden_ReturnsForbid()
    {
        var userId = Guid.NewGuid();
        await using var stream = new MemoryStream([1, 2]);
        var formFile = new FormFile(stream, 0, 2, "file", "a.png") { Headers = new HeaderDictionary(), ContentType = "image/png" };
        var request = new UploadMediaRequest { File = formFile, BrandId = Guid.NewGuid(), Folder = "f" };

        var mock = new Mock<IMediaService>();
        mock
            .Setup(s => s.UploadAsync(request, userId, "https://localhost:5001", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException());

        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var http = new DefaultHttpContext();
        http.Request.Scheme = "https";
        http.Request.Host = new HostString("localhost:5001");
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = http } };

        var result = await sut.Upload(request, CancellationToken.None);
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenUserIdNull_ReturnsUnauthorized()
    {
        var mock = new Mock<IMediaService>();
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns((Guid?)null);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Update(Guid.NewGuid(), new UpdateMediaItemRequest("name", "alt", "folder"), CancellationToken.None);
        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenForbidden_ReturnsForbid()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new UpdateMediaItemRequest("name", "alt", "folder");
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.UpdateAsync(id, request, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException());
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Update(id, request, CancellationToken.None);
        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new UpdateMediaItemRequest("name", "alt", "folder");
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.UpdateAsync(id, request, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException());
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Update(id, request, CancellationToken.None);
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Update_WhenSuccess_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new UpdateMediaItemRequest("name", "alt", "folder");
        var item = SampleItem(id);
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.UpdateAsync(id, request, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(item);
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Update(id, request, CancellationToken.None);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(item, ok.Value);
    }

    [Fact]
    public async Task Delete_WhenUserIdNull_ReturnsUnauthorized()
    {
        var mock = new Mock<IMediaService>();
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns((Guid?)null);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Delete(Guid.NewGuid(), CancellationToken.None);
        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Delete_WhenForbidden_ReturnsForbid()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.DeleteAsync(id, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnauthorizedAccessException());
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Delete(id, CancellationToken.None);
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Delete_WhenNotFound_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.DeleteAsync(id, userId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new KeyNotFoundException());
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Delete(id, CancellationToken.None);
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenSuccess_ReturnsNoContent()
    {
        var id = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var mock = new Mock<IMediaService>();
        mock.Setup(s => s.DeleteAsync(id, userId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var cur = new Mock<ICurrentUser>();
        cur.SetupGet(c => c.UserId).Returns(userId);
        var sut = new MediaItemsController(mock.Object, cur.Object) { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };

        var result = await sut.Delete(id, CancellationToken.None);
        Assert.IsType<NoContentResult>(result);
    }
}
