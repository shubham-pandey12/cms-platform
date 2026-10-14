using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class SiteLayoutConfiguration : IEntityTypeConfiguration<SiteLayout>
{
    public void Configure(EntityTypeBuilder<SiteLayout> builder)
    {
        builder.ToTable("site_layouts", "cms");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(l => l.Name).HasMaxLength(200).IsRequired();
        builder.Property(l => l.IsDefault).IsRequired();
        builder.Property(l => l.Header).HasColumnType("jsonb").IsRequired();
        builder.Property(l => l.Footer).HasColumnType("jsonb").IsRequired();
        builder.Property(l => l.Sidebar).HasColumnType("jsonb");

        builder.HasOne(l => l.Brand)
            .WithMany(b => b.SiteLayouts)
            .HasForeignKey(l => l.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.BrandId);
    }
}

