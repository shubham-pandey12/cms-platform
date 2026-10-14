using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities.MockData;

namespace Cms.Persistence.Configurations.MockData;

internal sealed class SimpleDestinationConfiguration : IEntityTypeConfiguration<SimpleDestination>
{
    public void Configure(EntityTypeBuilder<SimpleDestination> builder)
    {
        builder.ToTable("simple_destinations", "mock");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Type).HasMaxLength(100);
    }
}

