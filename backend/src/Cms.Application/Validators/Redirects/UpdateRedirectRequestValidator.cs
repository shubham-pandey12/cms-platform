using FluentValidation;
using Cms.Application.DTOs.Redirects;
using Cms.Domain.Enums;

namespace Cms.Application.Validators.Redirects;

public sealed class UpdateRedirectRequestValidator : AbstractValidator<UpdateRedirectRequest>
{
    public UpdateRedirectRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.From is not null || x.To is not null || x.Status.HasValue)
            .WithMessage("At least one of From, To, or Status must be provided.");

        When(x => x.From is not null, () =>
        {
            RuleFor(x => x.From!)
                .NotEmpty().WithMessage("From path cannot be empty.")
                .MaximumLength(1000).WithMessage("From path cannot exceed 1000 characters.")
                .Must(IsValidFromPath).WithMessage("From must be a relative path and cannot contain query or fragment.");
        });

        When(x => x.To is not null, () =>
        {
            RuleFor(x => x.To!)
                .NotEmpty().WithMessage("To cannot be empty.")
                .MaximumLength(1000).WithMessage("To cannot exceed 1000 characters.")
                .Must(IsAllowedRedirectTarget).WithMessage("To must be an internal path or an absolute http/https URL.");
        });

        When(x => x.Status.HasValue, () =>
        {
            RuleFor(x => x.Status!.Value)
                .IsInEnum()
                .Must(s => s is RedirectStatus.MovedPermanently or RedirectStatus.Found)
                .WithMessage("Status must be 301 or 302.");
        });
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
