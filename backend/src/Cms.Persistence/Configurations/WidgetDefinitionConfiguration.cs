using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class WidgetDefinitionConfiguration : IEntityTypeConfiguration<WidgetDefinition>
{
    public void Configure(EntityTypeBuilder<WidgetDefinition> builder)
    {
        builder.ToTable("widget_definitions", "cms");

        builder.HasKey(w => w.Id);
        builder.Property(w => w.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(w => w.Name).HasMaxLength(200).IsRequired();
        builder.Property(w => w.Description).HasMaxLength(1000);
        builder.Property(w => w.Icon).HasMaxLength(100);
        builder.Property(w => w.Version).HasMaxLength(50);
        builder.Property(w => w.Thumbnail).HasMaxLength(1000);
        builder.Property(w => w.ConfigSchema).HasColumnType("jsonb").IsRequired();
        builder.Property(w => w.DefaultConfig).HasColumnType("jsonb").IsRequired();
        builder.Property(w => w.BrandIds).HasColumnType("jsonb");

        builder.OwnsOne(w => w.DefaultStyles, styles =>
        {
            styles.Property(s => s.BackgroundColor).HasMaxLength(50);
            styles.Property(s => s.TextColor).HasMaxLength(50);
            styles.Property(s => s.Padding).HasMaxLength(20);
            styles.Property(s => s.Margin).HasMaxLength(20);
            styles.Property(s => s.BorderColor).HasMaxLength(50);
            styles.Property(s => s.Shadow).HasMaxLength(20);
            styles.Property(s => s.TextAlign).HasMaxLength(20);
            styles.Property(s => s.CustomClasses).HasMaxLength(500);
        });

        builder.Property(w => w.LatestVersionId);

        builder.Property(w => w.SupportsHtmlEmbed).HasDefaultValue(false);

        builder.HasIndex(w => w.Category);
        builder.HasIndex(w => w.Name);
        builder.HasIndex(w => w.Slug).IsUnique();
    }
}

