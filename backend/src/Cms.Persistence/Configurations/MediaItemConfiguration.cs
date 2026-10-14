using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;
using Cms.Domain.Enums;

namespace Cms.Persistence.Configurations;

internal sealed class MediaItemConfiguration : IEntityTypeConfiguration<MediaItem>
{
    public void Configure(EntityTypeBuilder<MediaItem> builder)
    {
        builder.ToTable("media_items", "cms");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(m => m.Name).HasMaxLength(500).IsRequired();
        builder.Property(m => m.Url).HasMaxLength(2000).IsRequired();
        builder.Property(m => m.Thumbnail).HasMaxLength(2000);
        builder.Property(m => m.Folder).HasMaxLength(500);
        builder.Property(m => m.Alt).HasMaxLength(500);

        builder.Property(m => m.StorageProvider)
            .HasConversion<int>()
            .HasDefaultValue(MediaStorageProvider.External);

        builder.Property(m => m.Content).HasColumnType("bytea");
        builder.Property(m => m.ContentType).HasMaxLength(200);
        builder.Property(m => m.BlobContainer).HasMaxLength(500);
        builder.Property(m => m.BlobKey).HasMaxLength(1000);

        builder.HasOne(m => m.Brand)
            .WithMany(b => b.MediaItems)
            .HasForeignKey(m => m.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.BrandId);
        builder.HasIndex(m => m.Folder);
    }
}

