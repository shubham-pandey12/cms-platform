namespace Cms.Api.Models.Proxy;

public sealed class ProxyResponseDto
{
    public int StatusCode { get; set; }
    public object? Data { get; set; }
    public Dictionary<string, string> Headers { get; set; } = new();
}

