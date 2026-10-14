using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Persistence.Configurations;

internal sealed class UserRoleAssignmentConfiguration : IEntityTypeConfiguration<UserRoleAssignment>
{
    public void Configure(EntityTypeBuilder<UserRoleAssignment> builder)
    {
        builder.ToTable("rbac_user_role_assignments", "cms");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ScopeType)
            .HasConversion<string>()
            .HasMaxLength(40)
            .IsRequired();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.RoleDefinition)
            .WithMany()
            .HasForeignKey(x => x.RoleDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Non-unique backing index for the optional Brand FK on ScopeId.
        // Uniqueness is enforced by partial indexes created in the migration (see
        // FixUserRoleAssignmentUniqueIndexes) because PostgreSQL treats NULL values as
        // distinct in standard unique indexes, which would allow duplicate org-scoped rows.
        builder.HasIndex(x => x.ScopeId);

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_rbac_user_role_assignments_scope",
            $"(\"ScopeType\" = '{AssignmentScopeType.Organization}' AND \"ScopeId\" IS NULL) OR (\"ScopeType\" = '{AssignmentScopeType.Brand}' AND \"ScopeId\" IS NOT NULL)"));
    }
}

