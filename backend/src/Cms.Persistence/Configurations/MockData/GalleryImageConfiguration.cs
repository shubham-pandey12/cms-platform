using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Configurations.MockData;

internal sealed class GalleryImageConfiguration : IEntityTypeConfiguration<GalleryImage>
{
    public void Configure(EntityTypeBuilder<GalleryImage> builder)
    {
        builder.ToTable("gallery_images", "mock");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(g => g.Src).HasMaxLength(2000).IsRequired();
        builder.Property(g => g.Alt).HasMaxLength(500);
        builder.Property(g => g.Caption).HasMaxLength(1000);
    }
}

