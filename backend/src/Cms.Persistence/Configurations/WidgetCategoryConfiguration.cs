using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class WidgetCategoryConfiguration : IEntityTypeConfiguration<WidgetCategoryDefinition>
{
    public void Configure(EntityTypeBuilder<WidgetCategoryDefinition> builder)
    {
        builder.ToTable("widget_categories", "cms");

        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.CategoryId).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Name).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Icon).HasMaxLength(100);
        builder.Property(c => c.Description).HasMaxLength(500);

        builder.HasIndex(c => c.CategoryId).IsUnique();
    }
}

