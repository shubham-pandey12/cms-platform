using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class PageDataConfigConfiguration : IEntityTypeConfiguration<PageDataConfig>
{
    public void Configure(EntityTypeBuilder<PageDataConfig> builder)
    {
        builder.ToTable("page_data_configs", "cms");

        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(p => p.Variables).HasColumnType("jsonb").IsRequired();
        builder.Property(p => p.ApiCalls).HasColumnType("jsonb").IsRequired();

        builder.HasOne(p => p.Page)
            .WithOne(page => page.PageData)
            .HasForeignKey<PageDataConfig>(p => p.PageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.PageId).IsUnique();
    }
}

