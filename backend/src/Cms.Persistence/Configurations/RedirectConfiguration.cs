using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class RedirectConfiguration : IEntityTypeConfiguration<Redirect>
{
    public void Configure(EntityTypeBuilder<Redirect> builder)
    {
        builder.ToTable("redirects", "cms");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.From).HasMaxLength(1000).IsRequired();
        builder.Property(r => r.To).HasMaxLength(1000).IsRequired();

        builder.HasOne(r => r.Brand)
            .WithMany(b => b.Redirects)
            .HasForeignKey(r => r.BrandId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => new { r.BrandId, r.From }).IsUnique();
    }
}

