using System.Text.RegularExpressions;
using FluentValidation;
using Cms.Application.DTOs.SiteSettings;

namespace Cms.Application.Validators.SiteSettings;

/// <summary>
/// Validates update site settings requests. Supported languages must be 5-character locale codes (e.g. en-GB, fr-FR).
/// </summary>
public sealed class UpdateSiteSettingsRequestValidator : AbstractValidator<UpdateSiteSettingsRequest>
{
    private static readonly Regex LocalePattern = new(@"^[a-z]{2}-[a-z]{2}$", RegexOptions.Compiled);

    public UpdateSiteSettingsRequestValidator()
    {
        When(x => x.SupportedLangs is not null, () =>
        {
            RuleFor(x => x.SupportedLangs)
                .Must(AllLocalesValid)
                .WithMessage("Each supported language must be a 5-character locale (e.g. en-GB, fr-FR).");
        });
    }

    private static bool AllLocalesValid(string[]? supportedLangs)
    {
        if (supportedLangs == null) return true;
        foreach (var code in supportedLangs)
        {
            if (string.IsNullOrWhiteSpace(code) || code.Length != 5)
                return false;
            var normalized = code.Trim().ToLowerInvariant();
            if (!LocalePattern.IsMatch(normalized))
                return false;
        }
        return true;
    }
}
