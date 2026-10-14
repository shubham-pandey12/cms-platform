using FluentValidation;
using Cms.Application.DTOs.Auth.Requests;

namespace Cms.Application.Validators.Auth;

public sealed class MosCallbackRequestValidator : AbstractValidator<MosCallbackRequest>
{
    public MosCallbackRequestValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required");

        RuleFor(x => x.RedirectUri)
            .NotEmpty().WithMessage("RedirectUri is required");
    }
}
