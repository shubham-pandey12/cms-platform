using Moq;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Services.Security;
using Cms.Domain.Entities;
using Cms.Domain.Enums;
using Xunit;

namespace Cms.Application.Tests.Security;

public sealed class PermissionResolverTests
{
    [Fact]
    public async Task WhenPermissionExistsAtOrganizationScopeThenReturnsTrue()
    {
        var userId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new UserRoleAssignment
                {
                    UserId = userId,
                    ScopeType = AssignmentScopeType.Organization,
                    RoleDefinition = new RoleDefinition
                    {
                        RolePermissions =
                        [
                            new RolePermission
                            {
                                PermissionDefinition = new PermissionDefinition { Key = "users.manage", Name = "Manage users" }
                            }
                        ]
                    }
                }
            ]);

        var sut = new PermissionResolver(repo.Object);
        var allowed = await sut.HasPermissionAsync(userId, "users.manage");

        Assert.True(allowed);
    }

    [Fact]
    public async Task WhenBrandPermissionRequestedForDifferentBrandThenReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new UserRoleAssignment
                {
                    UserId = userId,
                    ScopeType = AssignmentScopeType.Brand,
                    ScopeId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    RoleDefinition = new RoleDefinition
                    {
                        RolePermissions =
                        [
                            new RolePermission
                            {
                                PermissionDefinition = new PermissionDefinition { Key = "media.manage", Name = "Manage media" }
                            }
                        ]
                    }
                }
            ]);

        var sut = new PermissionResolver(repo.Object);
        var allowed = await sut.HasPermissionAsync(userId, "media.manage", Guid.Parse("22222222-2222-2222-2222-222222222222"));

        Assert.False(allowed);
    }

    [Fact]
    public async Task WhenOrganizationPermissionExistsThenBrandScopedCheckReturnsTrue()
    {
        // Org-level grant should satisfy a brand-scoped check.
        var userId = Guid.NewGuid();
        var brandId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new UserRoleAssignment
                {
                    UserId = userId,
                    ScopeType = AssignmentScopeType.Organization,
                    RoleDefinition = new RoleDefinition
                    {
                        RolePermissions =
                        [
                            new RolePermission
                            {
                                PermissionDefinition = new PermissionDefinition { Key = "media.manage", Name = "Manage media" }
                            }
                        ]
                    }
                }
            ]);

        var sut = new PermissionResolver(repo.Object);
        var allowed = await sut.HasPermissionAsync(userId, "media.manage", brandId);

        Assert.True(allowed);
    }

    [Fact]
    public async Task WhenEmptyPermissionKeyThenReturnsFalse()
    {
        var userId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var sut = new PermissionResolver(repo.Object);
        var allowed = await sut.HasPermissionAsync(userId, "   ");

        Assert.False(allowed);
        repo.Verify(x => x.GetUserAssignmentsAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task WhenCalledTwiceForSameUserThenHitsRepositoryOnce()
    {
        // Verifies the per-request cache works correctly.
        var userId = Guid.NewGuid();
        var repo = new Mock<IRbacRepository>();
        repo.Setup(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new UserRoleAssignment
                {
                    UserId = userId,
                    ScopeType = AssignmentScopeType.Organization,
                    RoleDefinition = new RoleDefinition
                    {
                        RolePermissions =
                        [
                            new RolePermission
                            {
                                PermissionDefinition = new PermissionDefinition { Key = "users.read", Name = "Read users" }
                            }
                        ]
                    }
                }
            ]);

        var sut = new PermissionResolver(repo.Object);
        await sut.HasPermissionAsync(userId, "users.read");
        await sut.HasPermissionAsync(userId, "users.read");

        repo.Verify(x => x.GetUserAssignmentsAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

