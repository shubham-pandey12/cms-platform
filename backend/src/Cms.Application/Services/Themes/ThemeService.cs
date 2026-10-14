using Microsoft.Extensions.Logging;
using Cms.Application.DTOs.Themes.Requests;
using Cms.Application.DTOs.Themes.Responses;
using Cms.Application.Interfaces.Repositories;
using Cms.Application.Interfaces.Services;
using Cms.Domain.Entities;
using Cms.Domain.ValueObjects;

namespace Cms.Application.Services.Themes;

/// <summary>
/// Service for theme operations.
/// </summary>
public sealed class ThemeService : IThemeService
{
    private readonly IThemeRepository _themeRepository;
    private readonly ILogger<ThemeService> _logger;

    public ThemeService(IThemeRepository themeRepository, ILogger<ThemeService> logger)
    {
        _themeRepository = themeRepository;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<List<ThemeDto>> GetAllAsync(Guid? brandId, CancellationToken cancellationToken = default)
    {
        var themes = await _themeRepository.GetAllByBrandIdAsync(brandId, cancellationToken);
        return themes.Select(MapToDto).ToList();
    }

    /// <inheritdoc />
    public async Task<ThemeDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var theme = await _themeRepository.GetByIdAsync(id, cancellationToken);
        return theme is null ? null : MapToDto(theme);
    }

    /// <inheritdoc />
    public async Task<ThemeDto> CreateAsync(CreateThemeRequest request, CancellationToken cancellationToken = default)
    {
        var theme = new Theme
        {
            Name = request.Name,
            Colors = new ThemeColors
            {
                Primary = request.Colors.Primary,
                Secondary = request.Colors.Secondary,
                Background = request.Colors.Background,
                Text = request.Colors.Text,
                Accent = request.Colors.Accent
            },
            Fonts = new ThemeFonts
            {
                Heading = request.Fonts.Heading,
                Body = request.Fonts.Body
            },
            HeadingFontConfig = request.HeadingFontConfig is not null
                ? new FontConfig
                {
                    Family = request.HeadingFontConfig.Family,
                    Weights = request.HeadingFontConfig.Weights,
                    Fallbacks = request.HeadingFontConfig.Fallbacks,
                    Source = request.HeadingFontConfig.Source,
                    Url = request.HeadingFontConfig.Url
                }
                : null,
            BodyFontConfig = request.BodyFontConfig is not null
                ? new FontConfig
                {
                    Family = request.BodyFontConfig.Family,
                    Weights = request.BodyFontConfig.Weights,
                    Fallbacks = request.BodyFontConfig.Fallbacks,
                    Source = request.BodyFontConfig.Source,
                    Url = request.BodyFontConfig.Url
                }
                : null,
            BrandId = request.BrandId
        };

        await _themeRepository.AddAsync(theme, cancellationToken);
        await _themeRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Theme created. ThemeId={ThemeId}, BrandId={BrandId}, Name={Name}",
            theme.Id,
            theme.BrandId,
            theme.Name);

        return MapToDto(theme);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var theme = await _themeRepository.GetByIdAsync(id, cancellationToken);
        if (theme is null)
        {
            return false;
        }

        if (theme.IsDefault)
        {
            _logger.LogWarning("Attempted to delete default theme. ThemeId={ThemeId}, BrandId={BrandId}", id, theme.BrandId);
            throw new InvalidOperationException("Cannot delete the default theme");
        }

        await _themeRepository.DeleteByIdAsync(id, cancellationToken);
        await _themeRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Theme deleted. ThemeId={ThemeId}, BrandId={BrandId}", id, theme.BrandId);
        return true;
    }

    private static ThemeDto MapToDto(Theme t)
    {
        return new ThemeDto(
            t.Id,
            t.Name,
            new ThemeColorsDto(t.Colors.Primary, t.Colors.Secondary, t.Colors.Background, t.Colors.Text, t.Colors.Accent),
            new ThemeFontsDto(t.Fonts.Heading, t.Fonts.Body),
            t.HeadingFontConfig is not null
                ? new FontConfigDto(t.HeadingFontConfig.Family, t.HeadingFontConfig.Weights, t.HeadingFontConfig.Fallbacks, t.HeadingFontConfig.Source, t.HeadingFontConfig.Url)
                : null,
            t.BodyFontConfig is not null
                ? new FontConfigDto(t.BodyFontConfig.Family, t.BodyFontConfig.Weights, t.BodyFontConfig.Fallbacks, t.BodyFontConfig.Source, t.BodyFontConfig.Url)
                : null,
            t.IsDefault,
            t.BrandId);
    }
}
