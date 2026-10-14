using Microsoft.AspNetCore.Identity;
using Moq;
using Cms.Application.Common.Interfaces;
using Cms.Application.Common.Security;
using Cms.Application.DTOs.Rbac;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Application.Services.Security;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Security;

public sealed class UserAssignmentServiceTests
{
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

    [Fact]
    public async Task WhenCallerUserIdMissingThenThrowsUnauthorizedAccessException()
    {
        var rbac = new Mock<IRbacRepository>();
        var resolver = new Mock<IPermissionResolver>();
        var userManager = CreateUserManagerMock();
        var currentUser = new Mock<ICurrentUser>();
        currentUser.Setup(x => x.UserId).Returns((Guid?)null);

        var sut = new UserAssignmentService(rbac.Object, resolver.Object, userManager.Object, currentUser.Object);
        var request = new UpdateUserAssignmentsRequest([]);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.UpdateUserAssignmentsAsync(Guid.NewGuid(), request, CancellationToken.None));
    }

    [Fact]
    public async Task WhenClearingAssignmentsWithoutOrgUsersManageThenThrows()
    {
        var targetUserId = Guid.NewGuid();
        var rbac = new Mock<IRbacRepository>();
        var resolver = new Mock<IPermissionResolver>();
        resolver.Setup(x => x.HasPermissionAsync(
                It.IsAny<Guid>(),
                PermissionCatalog.UsersManage,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var userManager = CreateUserManagerMock();
        userManager.Setup(x => x.FindByIdAsync(targetUserId.ToString()))
            .ReturnsAsync(new ApplicationUser { Id = targetUserId, Email = "a@b.com" });

        var currentUser = new Mock<ICurrentUser>();
        currentUser.Setup(x => x.UserId).Returns(Guid.NewGuid());

        var sut = new UserAssignmentService(rbac.Object, resolver.Object, userManager.Object, currentUser.Object);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.UpdateUserAssignmentsAsync(targetUserId, new UpdateUserAssignmentsRequest([]), CancellationToken.None));
    }

    [Fact]
    public async Task WhenBrandAssignmentWithoutBrandUsersManageThenThrows()
    {
        var targetUserId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        var rbac = new Mock<IRbacRepository>();
        rbac.Setup(x => x.GetRolesWithPermissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new RoleDefinition { Id = roleId, Key = RoleCatalog.ContentTeam, Name = "Editor", IsSystem = true }
            ]);
        rbac.Setup(x => x.BrandExistsAsync(brandId, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var resolver = new Mock<IPermissionResolver>();
        resolver.Setup(x => x.HasPermissionAsync(
                It.IsAny<Guid>(),
                PermissionCatalog.UsersManage,
                brandId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var userManager = CreateUserManagerMock();
        userManager.Setup(x => x.FindByIdAsync(targetUserId.ToString()))
            .ReturnsAsync(new ApplicationUser { Id = targetUserId, Email = "a@b.com" });

        var currentUser = new Mock<ICurrentUser>();
        currentUser.Setup(x => x.UserId).Returns(Guid.NewGuid());

        var sut = new UserAssignmentService(rbac.Object, resolver.Object, userManager.Object, currentUser.Object);
        var request = new UpdateUserAssignmentsRequest([
            new UserRoleAssignmentInputDto(roleId, AssignmentScopeType.Brand, brandId)
        ]);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            sut.UpdateUserAssignmentsAsync(targetUserId, request, CancellationToken.None));
    }

    [Fact]
    public async Task WhenAuthorizedThenCallsReplaceUserAssignments()
    {
        var targetUserId = Guid.NewGuid();
        var callerId = Guid.NewGuid();
        var adminRoleId = Guid.NewGuid();

        var rbac = new Mock<IRbacRepository>();
        rbac.Setup(x => x.GetRolesWithPermissionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new RoleDefinition { Id = adminRoleId, Key = RoleCatalog.Admin, Name = "Admin", IsSystem = true }
            ]);
        rbac.Setup(x => x.HasOrganizationAdminAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        rbac.Setup(x => x.GetUserAssignmentsAsync(targetUserId, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        rbac.Setup(x => x.ReplaceUserAssignmentsAsync(targetUserId, It.IsAny<IEnumerable<UserRoleAssignment>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        rbac.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var resolver = new Mock<IPermissionResolver>();
        resolver.Setup(x => x.HasPermissionAsync(
                callerId,
                PermissionCatalog.UsersManage,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        resolver.Setup(x => x.GetEffectivePermissionsAsync(targetUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePermissionsDto([], []));

        var userManager = CreateUserManagerMock();
        userManager.Setup(x => x.FindByIdAsync(targetUserId.ToString()))
            .ReturnsAsync(new ApplicationUser { Id = targetUserId, Email = "a@b.com" });

        var currentUser = new Mock<ICurrentUser>();
        currentUser.Setup(x => x.UserId).Returns(callerId);

        var sut = new UserAssignmentService(rbac.Object, resolver.Object, userManager.Object, currentUser.Object);
        var request = new UpdateUserAssignmentsRequest([
            new UserRoleAssignmentInputDto(adminRoleId, AssignmentScopeType.Organization, null)
        ]);

        await sut.UpdateUserAssignmentsAsync(targetUserId, request, CancellationToken.None);

        rbac.Verify(x => x.ReplaceUserAssignmentsAsync(
            targetUserId,
            It.Is<IEnumerable<UserRoleAssignment>>(rows => rows.Count() == 1),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
