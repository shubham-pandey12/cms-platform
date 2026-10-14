using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class BrandDomainConfiguration : IEntityTypeConfiguration<BrandDomain>
{
    public void Configure(EntityTypeBuilder<BrandDomain> builder)
    {
        builder.ToTable("brand_domains", "cms");

        builder.HasKey(bd => bd.Id);
        builder.Property(bd => bd.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(bd => bd.Domain).HasMaxLength(500).IsRequired();
        builder.HasIndex(bd => bd.Domain).IsUnique();

        builder.HasOne(bd => bd.Brand)
            .WithMany(b => b.BrandDomains)
            .HasForeignKey(bd => bd.BrandId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
