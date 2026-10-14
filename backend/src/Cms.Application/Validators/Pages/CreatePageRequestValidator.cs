using FluentValidation;
using Cms.Application.DTOs.Pages.Requests;

namespace Cms.Application.Validators.Pages;

public sealed class CreatePageRequestValidator : AbstractValidator<CreatePageRequest>
{
    public CreatePageRequestValidator()
    {
        RuleFor(x => x.BrandId)
            .NotEmpty().WithMessage("Brand ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Page name is required")
            .MaximumLength(200).WithMessage("Page name cannot exceed 200 characters");

        RuleFor(x => x.Uri)
            .NotEmpty().WithMessage("URI is required")
            .MaximumLength(500).WithMessage("URI cannot exceed 500 characters")
            .Must(uri => uri.StartsWith('/')).WithMessage("URI must start with /");

        RuleFor(x => x.LayoutId)
            .NotEmpty().WithMessage("Layout ID is required");
    }
}

