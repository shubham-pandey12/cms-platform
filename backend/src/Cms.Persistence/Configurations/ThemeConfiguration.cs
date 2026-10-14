using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Cms.Domain.Entities;

namespace Cms.Persistence.Configurations;

internal sealed class ThemeConfiguration : IEntityTypeConfiguration<Theme>
{
    public void Configure(EntityTypeBuilder<Theme> builder)
    {
        builder.ToTable("themes", "cms");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();

        builder.OwnsOne(t => t.Colors, colors =>
        {
            colors.Property(c => c.Primary).HasMaxLength(50).IsRequired();
            colors.Property(c => c.Secondary).HasMaxLength(50).IsRequired();
            colors.Property(c => c.Background).HasMaxLength(50).IsRequired();
            colors.Property(c => c.Text).HasMaxLength(50).IsRequired();
            colors.Property(c => c.Accent).HasMaxLength(50).IsRequired();
        });

        builder.OwnsOne(t => t.Fonts, fonts =>
        {
            fonts.Property(f => f.Heading).HasMaxLength(200);
            fonts.Property(f => f.Body).HasMaxLength(200);
        });

        builder.OwnsOne(t => t.HeadingFontConfig, font =>
        {
            font.Property(f => f.Family).HasMaxLength(200);
            font.Property(f => f.Weights).HasColumnType("jsonb");
            font.Property(f => f.Fallbacks).HasColumnType("jsonb");
            font.Property(f => f.Source).HasMaxLength(50);
            font.Property(f => f.Url).HasMaxLength(1000);
        });

        builder.OwnsOne(t => t.BodyFontConfig, font =>
        {
            font.Property(f => f.Family).HasMaxLength(200);
            font.Property(f => f.Weights).HasColumnType("jsonb");
            font.Property(f => f.Fallbacks).HasColumnType("jsonb");
            font.Property(f => f.Source).HasMaxLength(50);
            font.Property(f => f.Url).HasMaxLength(1000);
        });

        builder.HasOne(t => t.Brand)
            .WithMany()
            .HasForeignKey(t => t.BrandId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

