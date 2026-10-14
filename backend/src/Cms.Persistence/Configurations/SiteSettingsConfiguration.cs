using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class SiteSettingsConfiguration : IEntityTypeConfiguration<SiteSettings>
{
    public void Configure(EntityTypeBuilder<SiteSettings> builder)
    {
        builder.ToTable("site_settings", "cms");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.SiteName).HasMaxLength(200);
        builder.Property(s => s.SiteDescription).HasMaxLength(1000);
        builder.Property(s => s.Favicon).HasMaxLength(1000);
        builder.Property(s => s.OgImage).HasMaxLength(1000);
        builder.Property(s => s.NavigationPosition).HasMaxLength(20);
        builder.Property(s => s.NavigationStyle).HasMaxLength(50);
        builder.Property(s => s.LogoUrl).HasMaxLength(1000);
        builder.Property(s => s.GoogleAnalyticsId).HasMaxLength(100);
        builder.Property(s => s.CustomHeadCode);
        builder.Property(s => s.TwitterHandle).HasMaxLength(100);
        builder.Property(s => s.CustomDomain).HasMaxLength(500);
        builder.Property(s => s.RobotsTxt);
        builder.Property(s => s.CanonicalUrl).HasMaxLength(1000);
        builder.Property(s => s.GlobalCss);
        builder.Property(s => s.HeadScripts).HasColumnType("jsonb");
        builder.Property(s => s.BodyScripts).HasColumnType("jsonb");
        builder.Property(s => s.SupportedLangsJson).HasMaxLength(500).HasColumnType("jsonb");

        builder.HasOne(s => s.Brand)
            .WithOne(b => b.SiteSettings)
            .HasForeignKey<SiteSettings>(s => s.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.BrandId).IsUnique();
    }
}

