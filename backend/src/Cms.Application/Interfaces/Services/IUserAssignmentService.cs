using Cms.Application.DTOs.Rbac;

namespace Cms.Application.Interfaces.Services;

public interface IUserAssignmentService
{
    Task<UserAssignmentsResponseDto> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserAssignmentsResponseDto> UpdateUserAssignmentsAsync(Guid userId, UpdateUserAssignmentsRequest request, CancellationToken cancellationToken = default);
}

