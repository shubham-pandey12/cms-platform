using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Configurations.MockData;

internal sealed class TravelPackageConfiguration : IEntityTypeConfiguration<TravelPackage>
{
    public void Configure(EntityTypeBuilder<TravelPackage> builder)
    {
        builder.ToTable("travel_packages", "mock");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(2000);
        builder.Property(t => t.Price).HasMaxLength(100);
        builder.Property(t => t.Duration).HasMaxLength(100);
        builder.Property(t => t.Image).HasMaxLength(2000);
        builder.Property(t => t.Rating).HasPrecision(3, 2);
        builder.Property(t => t.Location).HasMaxLength(200);
    }
}

