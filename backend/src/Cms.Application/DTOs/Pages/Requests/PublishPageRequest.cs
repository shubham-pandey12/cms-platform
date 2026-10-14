namespace Cms.Application.DTOs.Pages.Requests;

/// <summary>
/// Request to publish a page with a specific semantic version.
/// When RevisionId is set, the existing revision is set as published; otherwise a new revision is created from the current page state.
/// </summary>
/// <param name="Version">The version to publish to (e.g. "1.2.3").</param>
/// <param name="RevisionId">Optional. When set, this revision is set as the published version instead of creating a new one.</param>
public sealed record PublishPageRequest(string Version, Guid? RevisionId = null);
