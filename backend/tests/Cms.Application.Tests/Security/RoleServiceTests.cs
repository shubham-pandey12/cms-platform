using Moq;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Services.Security;
using Cms.Domain.Entities;
using Microsoft.EntityFrameworkCore.Storage;
using Xunit;

namespace Cms.Application.Tests.Security;

public sealed class RoleServiceTests
{
    private static Mock<IDbContextTransaction> CreateTransactionMock()
    {
        var tx = new Mock<IDbContextTransaction>();
        tx.Setup(x => x.CommitAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        tx.Setup(x => x.DisposeAsync()).Returns(ValueTask.CompletedTask);
        return tx;
    }

    [Fact]
    public async Task WhenUpdateAdminRolePermissionsThenMinimumPermissionsAreEnforced()
    {
        var adminRoleId = Guid.NewGuid();
        var usersManagePermId = Guid.NewGuid();
        var rolesManagePermId = Guid.NewGuid();
        var mediaReadPermId = Guid.NewGuid();

        var adminRole = new RoleDefinition
        {
            Id = adminRoleId,
            Key = RoleCatalog.Admin,
            Name = "Admin",
            IsSystem = true,
            RolePermissions = []
        };

        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetRoleWithPermissionsAsync(adminRoleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(adminRole);
        repo.Setup(x => x.GetPermissionsByKeysAsync(It.IsAny<IEnumerable<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<string> keys, CancellationToken _) =>
                keys.Select(k => k switch
                {
                    PermissionCatalog.UsersManage => new PermissionDefinition { Id = usersManagePermId, Key = k, Name = k },
                    PermissionCatalog.RolesManage => new PermissionDefinition { Id = rolesManagePermId, Key = k, Name = k },
                    _ => new PermissionDefinition { Id = mediaReadPermId, Key = k, Name = k }
                }).ToList());
        repo.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        IEnumerable<Guid>? savedPermissionIds = null;
        repo.Setup(x => x.ReplaceRolePermissionsAsync(adminRoleId, It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .Callback<Guid, IEnumerable<Guid>, CancellationToken>((_, ids, _) => savedPermissionIds = ids.ToList())
            .Returns(Task.CompletedTask);

        var sut = new RoleService(repo.Object);

        // Request only media.read — minimum permissions should be injected automatically.
        var request = new UpdateRolePermissionsRequest([PermissionCatalog.MediaRead]);
        await sut.UpdateRolePermissionsAsync(adminRoleId, request, CancellationToken.None);

        Assert.NotNull(savedPermissionIds);
        var ids = savedPermissionIds!.ToHashSet();
        Assert.Contains(usersManagePermId, ids);
        Assert.Contains(rolesManagePermId, ids);
    }

    [Fact]
    public async Task WhenCreateRoleWithExistingKeyThenThrowsArgumentException()
    {
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetRoleByKeyAsync("custom_role", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoleDefinition { Id = Guid.NewGuid(), Key = "custom_role", Name = "Existing" });
        repo.Setup(x => x.BeginTransactionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateTransactionMock().Object);

        var sut = new RoleService(repo.Object);
        var request = new CreateRoleRequest("custom_role", "Custom Role", null, null);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            sut.CreateRoleAsync(request, CancellationToken.None));
    }

    [Fact]
    public async Task WhenDeleteSystemRoleThenThrowsInvalidOperationException()
    {
        var roleId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetRoleWithPermissionsAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoleDefinition { Id = roleId, Key = RoleCatalog.Admin, Name = "Admin", IsSystem = true, RolePermissions = [] });

        var sut = new RoleService(repo.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.DeleteRoleAsync(roleId, CancellationToken.None));
    }

    [Fact]
    public async Task WhenDeleteRoleWithAssignmentsThenThrowsInvalidOperationException()
    {
        var roleId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetRoleWithPermissionsAsync(roleId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoleDefinition { Id = roleId, Key = "custom", Name = "Custom", IsSystem = false, RolePermissions = [] });
        repo.Setup(x => x.RoleHasAssignmentsAsync(roleId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sut = new RoleService(repo.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.DeleteRoleAsync(roleId, CancellationToken.None));
    }
}
