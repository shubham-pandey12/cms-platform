using System.Text.Json.Serialization;

namespace Cms.Application.DTOs.Mos;

/// <summary>
/// Response from MOS Gateway GET /oauth/whoami (WhoamiDto).
/// </summary>
internal sealed class MosWhoamiDto
{
    [JsonPropertyName("subject")]
    public string? Subject { get; set; }

    [JsonPropertyName("identity")]
    public MosWhoamiIdentityDto? Identity { get; set; }
}

/// <summary>
/// Nested identity object (WhoamiIdentityDto).
/// </summary>
internal sealed class MosWhoamiIdentityDto
{
    [JsonPropertyName("mosStaffMember")]
    public MosWhoamiMosStaffMemberDto? MosStaffMember { get; set; }
}

/// <summary>
/// MOS staff member from whoami (WhoamiIdentityMosStaffMemberDto).
/// </summary>
internal sealed class MosWhoamiMosStaffMemberDto
{
    [JsonPropertyName("id")]
    public long? Id { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("firstName")]
    public string? FirstName { get; set; }

    [JsonPropertyName("lastName")]
    public string? LastName { get; set; }

    [JsonPropertyName("brands")]
    public List<long>? Brands { get; set; }
}
