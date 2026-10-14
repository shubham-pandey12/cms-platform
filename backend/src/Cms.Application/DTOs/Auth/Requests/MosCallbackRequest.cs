namespace Cms.Application.DTOs.Auth.Requests;

/// <summary>
/// Request body for exchanging an MOS OAuth authorization code for a CMS session.
/// </summary>
public sealed record MosCallbackRequest(string Code, string RedirectUri);
