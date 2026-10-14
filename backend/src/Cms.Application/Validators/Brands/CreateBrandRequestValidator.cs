using FluentValidation;
using Cms.Application.DTOs.Brands.Requests;

namespace Cms.Application.Validators.Brands;

public sealed class CreateBrandRequestValidator : AbstractValidator<CreateBrandRequest>
{
    public CreateBrandRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Brand name is required")
            .MaximumLength(200).WithMessage("Brand name cannot exceed 200 characters");

        RuleFor(x => x.Domain)
            .NotEmpty().WithMessage("Domain is required")
            .MaximumLength(500).WithMessage("Domain cannot exceed 500 characters");

        RuleFor(x => x.PrimaryColor)
            .NotEmpty().WithMessage("Primary color is required")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$").WithMessage("Invalid hex color format");

        RuleFor(x => x.SecondaryColor)
            .NotEmpty().WithMessage("Secondary color is required")
            .Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$").WithMessage("Invalid hex color format");
    }
}

