using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class WidgetDefinitionVersionConfiguration : IEntityTypeConfiguration<WidgetDefinitionVersion>
{
    public void Configure(EntityTypeBuilder<WidgetDefinitionVersion> builder)
    {
        builder.ToTable("widget_definition_versions", "cms");

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(v => v.Slug).HasMaxLength(200).IsRequired();
        builder.Property(v => v.Version).HasMaxLength(50).IsRequired();
        builder.Property(v => v.Name).HasMaxLength(200).IsRequired();
        builder.Property(v => v.Description).HasMaxLength(1000);
        builder.Property(v => v.ConfigSchema).HasColumnType("jsonb").IsRequired();
        builder.Property(v => v.DefaultConfig).HasColumnType("jsonb").IsRequired();
        builder.Property(v => v.ChangeLog).HasMaxLength(2000);

        builder.OwnsOne(v => v.DefaultStyles, styles =>
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

        builder.HasOne(v => v.WidgetDefinition)
            .WithMany(w => w.Versions)
            .HasForeignKey(v => v.WidgetDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new { v.Slug, v.Version }).IsUnique();
        builder.HasIndex(v => v.Slug);
        builder.HasIndex(v => v.IsLatest);
    }
}
