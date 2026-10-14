namespace Cms.Application.DTOs.PageData;

/// <summary>
/// Response containing page variables and API call configurations.
/// </summary>
public sealed record PageDataResponse(
    IReadOnlyList<PageVariableDto> Variables,
    IReadOnlyList<ApiCallDto> ApiCalls);

public sealed record PageVariableDto(string Name, string Value, string Source);

public sealed record ApiCallDto(
    string Id,
    string Name,
    string Endpoint,
    string Method,
    Dictionary<string, string>? Headers,
    Dictionary<string, string>? Params,
    string? Body,
    ApiAuthDto? Auth,
    int? Timeout,
    bool? CacheEnabled,
    int? CacheDuration);

public sealed record ApiAuthDto(
    string Type,
    string? Token,
    string? ApiKey,
    string? ApiKeyHeader,
    string? Username,
    string? Password);
