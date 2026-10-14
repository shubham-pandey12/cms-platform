using FluentValidation;
using Cms.Application.DTOs.Redirects;
using Cms.Domain.Enums;

namespace Cms.Application.Validators.Redirects;

public sealed class CreateRedirectRequestValidator : AbstractValidator<CreateRedirectRequest>
{
    public CreateRedirectRequestValidator()
    {
        RuleFor(x => x.From)
            .NotEmpty().WithMessage("From path is required.")
            .MaximumLength(1000).WithMessage("From path cannot exceed 1000 characters.")
            .Must(IsValidFromPath).WithMessage("From must be a relative path and cannot contain query or fragment.");

        RuleFor(x => x.To)
            .NotEmpty().WithMessage("To path or URL is required.")
            .MaximumLength(1000).WithMessage("To cannot exceed 1000 characters.")
            .Must(IsAllowedRedirectTarget).WithMessage("To must be an internal path or an absolute http/https URL.");

        RuleFor(x => x.Status)
            .IsInEnum()
            .Must(s => s is RedirectStatus.MovedPermanently or RedirectStatus.Found)
            .WithMessage("Status must be MovedPermanently (301) or Found (302).");
    }

    private static bool IsValidFromPath(string from)
    {
        var trimmed = from.Trim();
        return !trimmed.Contains('?', StringComparison.Ordinal)
            && !trimmed.Contains('#', StringComparison.Ordinal)
            && !Uri.TryCreate(trimmed, UriKind.Absolute, out _);
    }

    private static bool IsAllowedRedirectTarget(string to)
    {
        var trimmed = to.Trim();
        if (trimmed.StartsWith("//", StringComparison.Ordinal))
            return false;

        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            return string.Equals(absolute.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
                || string.Equals(absolute.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);

        return true;
    }
}
