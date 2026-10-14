namespace Cms.Application.DTOs.Auth.Requests;

public sealed record RegisterRequest(string Email, string Password, string Name);

