namespace Cms.Application.Common.Interfaces;

/// <summary>
/// Provides access to the current authenticated user.
/// </summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}

