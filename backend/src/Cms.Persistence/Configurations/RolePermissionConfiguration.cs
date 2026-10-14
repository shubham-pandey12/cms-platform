using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.ToTable("rbac_role_permissions", "cms");

        builder.HasKey(x => new { x.RoleDefinitionId, x.PermissionDefinitionId });

        builder.HasOne(x => x.RoleDefinition)
            .WithMany(x => x.RolePermissions)
            .HasForeignKey(x => x.RoleDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PermissionDefinition)
            .WithMany(x => x.RolePermissions)
            .HasForeignKey(x => x.PermissionDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

