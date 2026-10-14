using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class BrandConfiguration : IEntityTypeConfiguration<Brand>
{
    public void Configure(EntityTypeBuilder<Brand> builder)
    {
        builder.ToTable("brands", "cms");

        builder.HasKey(b => b.Id);
        builder.Property(b => b.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(b => b.Name).HasMaxLength(200).IsRequired();
        builder.Property(b => b.Domain).HasMaxLength(500).IsRequired();
        builder.Property(b => b.Subdomain).HasMaxLength(200);
        builder.Property(b => b.Logo).HasMaxLength(1000);
        builder.Property(b => b.PrimaryColor).HasMaxLength(50).IsRequired();
        builder.Property(b => b.SecondaryColor).HasMaxLength(50).IsRequired();
        builder.Property(b => b.GlobalCss);
        builder.Property(b => b.CustomFontUrls).HasColumnType("jsonb");

        builder.HasIndex(b => b.Domain).IsUnique();
        builder.HasIndex(b => b.Subdomain);
    }
}

