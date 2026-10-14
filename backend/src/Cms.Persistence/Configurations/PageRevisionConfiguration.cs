using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class PageRevisionConfiguration : IEntityTypeConfiguration<PageRevision>
{
    public void Configure(EntityTypeBuilder<PageRevision> builder)
    {
        builder.ToTable("page_revisions", "cms");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.LayoutData).HasColumnType("jsonb").IsRequired();
        builder.Property(r => r.LayoutConfigJson).HasColumnType("jsonb");
        builder.Property(r => r.CustomCss);

        builder.OwnsOne(r => r.Seo, seo =>
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

        builder.HasOne(r => r.Page)
            .WithMany(p => p.Revisions)
            .HasForeignKey(r => r.PageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.PageId);
    }
}

