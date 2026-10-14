using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Configurations.MockData;

internal sealed class DestinationConfiguration : IEntityTypeConfiguration<Destination>
{
    public void Configure(EntityTypeBuilder<Destination> builder)
    {
        builder.ToTable("destinations", "mock");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.Description).HasMaxLength(2000);
        builder.Property(d => d.Price).HasMaxLength(100);
        builder.Property(d => d.Rating).HasPrecision(3, 2);
        builder.Property(d => d.Image).HasMaxLength(2000);
        builder.Property(d => d.Link).HasMaxLength(1000);
    }
}

