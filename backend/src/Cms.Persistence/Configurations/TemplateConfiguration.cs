using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class TemplateConfiguration : IEntityTypeConfiguration<Template>
{
    public void Configure(EntityTypeBuilder<Template> builder)
    {
        builder.ToTable("templates", "cms");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(1000);
        builder.Property(t => t.BodyContent).HasColumnType("jsonb").IsRequired();
        builder.Property(t => t.Thumbnail).HasMaxLength(1000);
        builder.Property(t => t.Category).HasMaxLength(100);

        builder.HasOne(t => t.Brand)
            .WithMany(b => b.Templates)
            .HasForeignKey(t => t.BrandId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

