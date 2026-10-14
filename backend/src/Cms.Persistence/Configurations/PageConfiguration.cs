using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class PageConfiguration : IEntityTypeConfiguration<Page>
{
    public void Configure(EntityTypeBuilder<Page> builder)
    {
        builder.ToTable("pages", "cms");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Uri).HasMaxLength(500).IsRequired();
        builder.Property(p => p.DynamicVariables).HasColumnType("jsonb");
        builder.Property(p => p.BodyContent).HasColumnType("jsonb").IsRequired();
        builder.Property(p => p.LayoutConfigJson).HasColumnType("jsonb");
        builder.Property(p => p.CustomCss);
        builder.Property(p => p.Version).HasMaxLength(20).IsRequired();

        builder.OwnsOne(p => p.Seo, seo =>
        {
            seo.Property(s => s.Title).HasMaxLength(200);
            seo.Property(s => s.Description).HasMaxLength(500);
            seo.Property(s => s.Keywords).HasColumnType("jsonb");
            seo.Property(s => s.CanonicalUrl).HasMaxLength(500);
            seo.Property(s => s.OgTitle).HasMaxLength(200);
            seo.Property(s => s.OgDescription).HasMaxLength(500);
            seo.Property(s => s.OgImage).HasMaxLength(1000);
            seo.Property(s => s.TwitterCard).HasMaxLength(100);
            seo.Property(s => s.TwitterTitle).HasMaxLength(200);
            seo.Property(s => s.TwitterDescription).HasMaxLength(500);
            seo.Property(s => s.TwitterImage).HasMaxLength(1000);
        });

        builder.HasOne(p => p.Brand)
            .WithMany(b => b.Pages)
            .HasForeignKey(p => p.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Theme)
            .WithMany()
            .HasForeignKey(p => p.ThemeId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.Layout)
            .WithMany(l => l.Pages)
            .HasForeignKey(p => p.LayoutId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.BrandId, p.Uri }).IsUnique();
    }
}

