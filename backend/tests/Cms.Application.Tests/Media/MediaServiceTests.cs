using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Cms.Application.DTOs.Media.Requests;
using Cms.Application.DTOs.Media.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Options;
using Cms.Application.Services.Media;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Media;

public sealed class MediaServiceTests
{
    private static readonly byte[] MinimalPng =
        Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");

    private static Mock<UserManager<ApplicationUser>> CreateUserManagerMock()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!);
    }

    private static void SetupAuthorizedUser(
        Mock<UserManager<ApplicationUser>> userManager,
        Guid userId,
        IEnumerable<Guid> brandIds,
        IEnumerable<string>? roles = null)
    {
        var roleList = (roles ?? [nameof(UserRole.ContentTeam)]).ToList();
        var user = new ApplicationUser
        {
            Id = userId,
            Name = "Tester",
            Email = "tester@example.com",
            BrandIds = brandIds.ToList(),
        };

        userManager.Setup(x => x.FindByIdAsync(userId.ToString())).ReturnsAsync(user);
        userManager.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(roleList);
    }

    private static MediaService CreateSut(
        Mock<IMediaRepository> mediaRepo,
        Mock<IBrandRepository>? brandRepo = null,
        Mock<UserManager<ApplicationUser>>? userManager = null)
    {
        brandRepo ??= new Mock<IBrandRepository>();
        userManager ??= CreateUserManagerMock();
        return new MediaService(
            mediaRepo.Object,
            brandRepo.Object,
            userManager.Object,
            Microsoft.Extensions.Options.Options.Create(new MediaOptions()),
            Mock.Of<ILogger<MediaService>>());
    }

    [Fact]
    public async Task UploadAsync_PersistsDatabaseStorageAndFileApiUrl()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);

        var sut = CreateSut(repo, userManager: userManager);

        await using var stream = new MemoryStream([1, 2, 3, 4]);
        var formFile = new FormFile(stream, 0, 4, "file", "photo.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "heroes",
            Alt = null,
        };

        var result = await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);

        Assert.NotNull(captured);
        Assert.Equal(MediaStorageProvider.Database, captured!.StorageProvider);
        Assert.NotNull(captured.Content);
        Assert.Equal(4, captured.Content!.Length);
        Assert.Equal("image/png", captured.ContentType);
        Assert.Equal("heroes", captured.Folder);
        Assert.Contains("/api/media/", result.Url, StringComparison.Ordinal);
        Assert.EndsWith("/file", result.Url, StringComparison.Ordinal);
        Assert.Equal(MediaStorageProvider.Database, result.StorageProvider);
    }

    [Fact]
    public async Task UploadAsync_WhenBrandOutOfScope_ThrowsUnauthorized()
    {
        var repo = new Mock<IMediaRepository>();
        var userId = Guid.NewGuid();
        var requestedBrandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [Guid.NewGuid()]);

        var sut = CreateSut(repo, userManager: userManager);
        await using var stream = new MemoryStream([1, 2]);
        var formFile = new FormFile(stream, 0, 2, "file", "x.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };
        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = requestedBrandId,
            Folder = "lib",
        };

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None));
    }

    [Fact]
    public async Task GetFileAsync_Database_ReturnsBytes()
    {
        var id = Guid.NewGuid();
        var bytes = new byte[] { 9, 8, 7 };
        var entity = new MediaItem
        {
            Id = id,
            Name = "x.png",
            Url = "https://localhost/api/media/" + id + "/file",
            Thumbnail = "https://localhost/api/media/" + id + "/file",
            Type = MediaType.Image,
            Size = 3,
            BrandId = Guid.NewGuid(),
            Folder = "lib",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
            Content = bytes,
            ContentType = "image/png",
        };

        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdWithContentAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        var sut = CreateSut(repo);
        var result = await sut.GetFileAsync(id, CancellationToken.None);

        var found = Assert.IsType<MediaFileResult.Found>(result);
        Assert.Equal(bytes, found.Content);
        Assert.Equal("image/png", found.ContentType);
    }

    [Fact]
    public async Task GetFileAsync_External_ReturnsExternalNotStreamed()
    {
        var id = Guid.NewGuid();
        var entity = new MediaItem
        {
            Id = id,
            Name = "remote.jpg",
            Url = "https://example.com/a.jpg",
            Thumbnail = "https://example.com/a.jpg",
            Type = MediaType.Image,
            Size = 1,
            BrandId = Guid.NewGuid(),
            Folder = "lib",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.External,
        };

        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdWithContentAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(entity);
        var sut = CreateSut(repo);
        var result = await sut.GetFileAsync(id, CancellationToken.None);
        Assert.IsType<MediaFileResult.ExternalNotStreamed>(result);
    }

    [Fact]
    public async Task UploadAsync_WebP_EncodesPng()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        await using var stream = new MemoryStream(MinimalPng);
        var formFile = new FormFile(stream, 0, MinimalPng.Length, "file", "dot.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
            OutputFormat = "webp",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);

        Assert.NotNull(captured);
        Assert.Equal("image/webp", captured!.ContentType);
        Assert.EndsWith(".webp", captured.Name, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UploadAsync_AvifOutputFormat_Throws()
    {
        var repo = new Mock<IMediaRepository>();
        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        await using var stream = new MemoryStream(MinimalPng);
        var formFile = new FormFile(stream, 0, MinimalPng.Length, "file", "dot.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
            OutputFormat = "avif",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None));
    }

    [Fact]
    public async Task UploadAsync_Gif_IgnoresWebPOutput()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var gifBytes = new byte[] { 0x47, 0x49, 0x46, 0x38 };
        await using var stream = new MemoryStream(gifBytes);
        var formFile = new FormFile(stream, 0, gifBytes.Length, "file", "x.gif")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/gif",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
            OutputFormat = "webp",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);
        Assert.NotNull(captured);
        Assert.Equal(gifBytes, captured!.Content);
    }

    [Fact]
    public async Task UploadAsync_InvalidOutputFormat_Throws()
    {
        var repo = new Mock<IMediaRepository>();
        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        await using var stream = new MemoryStream(MinimalPng);
        var formFile = new FormFile(stream, 0, MinimalPng.Length, "file", "dot.png")
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
            OutputFormat = "bmp",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None));
    }

    [Fact]
    public async Task UploadAsync_Pdf_PersistsDocument()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var pdfBytes = "%PDF-1.4 minimal"u8.ToArray();
        await using var stream = new MemoryStream(pdfBytes);
        var formFile = new FormFile(stream, 0, pdfBytes.Length, "file", "report.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "docs",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);
        Assert.NotNull(captured);
        Assert.Equal(MediaType.Document, captured!.Type);
        Assert.Equal("application/pdf", captured.ContentType);
    }

    [Fact]
    public async Task UploadAsync_Xlsx_PersistsDocument()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var bytes = new byte[] { 0x50, 0x4B, 0x03, 0x04 };
        await using var stream = new MemoryStream(bytes);
        var formFile = new FormFile(stream, 0, bytes.Length, "file", "sheet.xlsx")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "docs",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);
        Assert.NotNull(captured);
        Assert.Equal(MediaType.Document, captured!.Type);
    }

    [Fact]
    public async Task UploadAsync_DisallowedMime_Throws()
    {
        var repo = new Mock<IMediaRepository>();
        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var bytes = new byte[] { 0x4D, 0x5A };
        await using var stream = new MemoryStream(bytes);
        var formFile = new FormFile(stream, 0, bytes.Length, "file", "run.exe")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/x-msdownload",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None));
    }

    [Fact]
    public async Task UploadAsync_OctetStream_WithPdfExtension_InfersPdf()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var pdfBytes = "%PDF-1.4"u8.ToArray();
        await using var stream = new MemoryStream(pdfBytes);
        var formFile = new FormFile(stream, 0, pdfBytes.Length, "file", "a.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);
        Assert.NotNull(captured);
        Assert.Equal("application/pdf", captured!.ContentType);
    }

    [Fact]
    public async Task UploadAsync_OctetStream_UnknownExtension_Throws()
    {
        var repo = new Mock<IMediaRepository>();
        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        await using var stream = new MemoryStream([1, 2]);
        var formFile = new FormFile(stream, 0, 2, "file", "unknown.bin")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/octet-stream",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None));
    }

    [Fact]
    public async Task UploadAsync_Pdf_WithWebPOutput_KeepsPdfBytes()
    {
        MediaItem? captured = null;
        var repo = new Mock<IMediaRepository>();
        repo
            .Setup(r => r.AddAsync(It.IsAny<MediaItem>(), It.IsAny<CancellationToken>()))
            .Callback<MediaItem, CancellationToken>((m, _) => captured = m)
            .ReturnsAsync((MediaItem m, CancellationToken _) => m);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var pdfBytes = "%PDF-1.4 x"u8.ToArray();
        await using var stream = new MemoryStream(pdfBytes);
        var formFile = new FormFile(stream, 0, pdfBytes.Length, "file", "doc.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf",
        };

        var request = new UploadMediaRequest
        {
            File = formFile,
            BrandId = brandId,
            Folder = "lib",
            OutputFormat = "webp",
        };

        await sut.UploadAsync(request, userId, "https://localhost:5001", CancellationToken.None);
        Assert.NotNull(captured);
        Assert.Equal("application/pdf", captured!.ContentType);
        Assert.Equal(pdfBytes, captured.Content);
    }

    [Fact]
    public async Task UpdateAsync_WhenAuthorized_UpdatesMetadata()
    {
        var id = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var media = new MediaItem
        {
            Id = id,
            Name = "old.png",
            Url = "u",
            Thumbnail = "t",
            Type = MediaType.Image,
            Size = 10,
            BrandId = brandId,
            Folder = "old",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
            Content = [1],
            ContentType = "image/png",
        };

        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(media);
        repo.Setup(r => r.UpdateAsync(media, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        var result = await sut.UpdateAsync(id, new UpdateMediaItemRequest("new.png", "alt", "new"), userId, CancellationToken.None);
        Assert.Equal("new.png", result.Name);
        Assert.Equal("new", result.Folder);
        Assert.Equal("alt", result.Alt);
    }

    [Fact]
    public async Task UpdateAsync_WhenOutOfScope_ThrowsUnauthorized()
    {
        var id = Guid.NewGuid();
        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(new MediaItem
        {
            Id = id,
            Name = "x",
            Url = "u",
            Thumbnail = "t",
            Type = MediaType.Image,
            Size = 1,
            BrandId = Guid.NewGuid(),
            Folder = "f",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
        });

        var userId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [Guid.NewGuid()]);
        var sut = CreateSut(repo, userManager: userManager);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.UpdateAsync(id, new UpdateMediaItemRequest("n", null, null), userId, CancellationToken.None));
    }

    [Fact]
    public async Task DeleteAsync_WhenAuthorized_Deletes()
    {
        var id = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var media = new MediaItem
        {
            Id = id,
            Name = "x",
            Url = "u",
            Thumbnail = "t",
            Type = MediaType.Image,
            Size = 1,
            BrandId = brandId,
            Folder = "f",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
        };

        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(media);
        repo.Setup(r => r.DeleteAsync(media, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repo.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [brandId]);
        var sut = CreateSut(repo, userManager: userManager);

        await sut.DeleteAsync(id, userId, CancellationToken.None);
        repo.Verify(r => r.DeleteAsync(media, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenOutOfScope_ThrowsUnauthorized()
    {
        var id = Guid.NewGuid();
        var repo = new Mock<IMediaRepository>();
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(new MediaItem
        {
            Id = id,
            Name = "x",
            Url = "u",
            Thumbnail = "t",
            Type = MediaType.Image,
            Size = 1,
            BrandId = Guid.NewGuid(),
            Folder = "f",
            UploadedBy = Guid.NewGuid(),
            UploadedAt = DateTime.UtcNow,
            StorageProvider = MediaStorageProvider.Database,
        });

        var userId = Guid.NewGuid();
        var userManager = CreateUserManagerMock();
        SetupAuthorizedUser(userManager, userId, [Guid.NewGuid()]);
        var sut = CreateSut(repo, userManager: userManager);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => sut.DeleteAsync(id, userId, CancellationToken.None));
    }
}
