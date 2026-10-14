using System.Diagnostics;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Cms.Api.Models.Proxy;
using Cms.Api.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Cms.Api.Services.Proxy;

public interface IProxyService
{
    Task<ProxyResponseDto> ExecuteAsync(ProxyRequestDto request, CancellationToken cancellationToken);
}

public sealed class ProxyService : IProxyService
{
    private static readonly HashSet<string> AllowedMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethod.Get.Method,
        HttpMethod.Post.Method,
        HttpMethod.Put.Method,
        HttpMethod.Delete.Method,
        HttpMethod.Patch.Method
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ProxyOptions _options;
    private readonly ILogger<ProxyService> _logger;

    public ProxyService(
        IHttpClientFactory httpClientFactory,
        IOptions<ProxyOptions> options,
        ILogger<ProxyService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ProxyResponseDto> ExecuteAsync(ProxyRequestDto request, CancellationToken cancellationToken)
    {
        ValidateRequest(request);

        var targetUri = ResolveTargetUri(request);
        EnsureHostAllowed(targetUri);

        using var cts = CreateTimeoutCts(request.TimeoutMs, cancellationToken);
        var client = _httpClientFactory.CreateClient(nameof(ProxyService));

        using var httpRequest = new HttpRequestMessage(new HttpMethod(request.Method), targetUri);

        ApplyHeaders(request, httpRequest);
        InjectCredentials(request.CredentialKey, httpRequest);
        ApplyBody(request, httpRequest);

        var sw = Stopwatch.StartNew();
        using var response = await client.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cts.Token);
        sw.Stop();

        _logger.LogInformation(
            "Proxy request completed. Method={Method}, Host={Host}, StatusCode={StatusCode}, ElapsedMs={ElapsedMs}",
            request.Method,
            targetUri.Host,
            (int)response.StatusCode,
            sw.ElapsedMilliseconds);

        var responseDto = new ProxyResponseDto
        {
            StatusCode = (int)response.StatusCode,
            Headers = response.Headers
                .Where(h => !IsSensitiveHeader(h.Key))
                .ToDictionary(h => h.Key, h => string.Join(",", h.Value), StringComparer.OrdinalIgnoreCase)
        };

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        await EnsureResponseSizeWithinLimit(response, cts.Token);
        var bodyText = await response.Content.ReadAsStringAsync(cts.Token);

        if (IsJson(contentType))
        {
            try
            {
                responseDto.Data = JsonSerializer.Deserialize<object?>(bodyText, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                responseDto.Data = bodyText;
            }
        }
        else
        {
            responseDto.Data = bodyText;
        }

        return responseDto;
    }

    private void ValidateRequest(ProxyRequestDto request)
    {
        if (!AllowedMethods.Contains(request.Method))
        {
            throw new InvalidOperationException($"HTTP method '{request.Method}' is not allowed.");
        }
    }

    private Uri ResolveTargetUri(ProxyRequestDto request)
    {
        if (Uri.TryCreate(request.Endpoint, UriKind.Absolute, out var absolute))
        {
            return absolute;
        }

        if (!string.IsNullOrWhiteSpace(request.BaseUrlKey) &&
            _options.BaseUrls.TryGetValue(request.BaseUrlKey, out var baseUrl) &&
            Uri.TryCreate(baseUrl, UriKind.Absolute, out var baseUri))
        {
            return new Uri(baseUri, request.Endpoint.TrimStart('/'));
        }

        throw new InvalidOperationException("Endpoint must be an absolute URL or paired with a valid BaseUrlKey.");
    }

    private void EnsureHostAllowed(Uri uri)
    {
        var host = uri.Host.ToLowerInvariant();
        if (!_options.AllowedHosts.Any(h => string.Equals(h, host, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException($"Host '{host}' is not allowed by proxy configuration.");
        }
    }

    private static CancellationTokenSource CreateTimeoutCts(int? timeoutMs, CancellationToken callerToken)
    {
        var effectiveMs = timeoutMs ?? 0;
        if (effectiveMs <= 0)
        {
            effectiveMs = 30_000;
        }
        var cts = CancellationTokenSource.CreateLinkedTokenSource(callerToken);
        cts.CancelAfter(effectiveMs);
        return cts;
    }

    private void ApplyHeaders(ProxyRequestDto request, HttpRequestMessage httpRequest)
    {
        // Remove any user-supplied auth headers
        if (request.Headers is null) return;

        foreach (var (key, value) in request.Headers)
        {
            if (IsSensitiveHeader(key))
            {
                continue;
            }
            httpRequest.Headers.TryAddWithoutValidation(key, value);
        }

        if (request.Query is { Count: > 0 })
        {
            var uriBuilder = new UriBuilder(httpRequest.RequestUri!);
            var query = System.Web.HttpUtility.ParseQueryString(uriBuilder.Query);
            foreach (var kvp in request.Query)
            {
                query[kvp.Key] = kvp.Value;
            }
            uriBuilder.Query = query.ToString() ?? string.Empty;
            httpRequest.RequestUri = uriBuilder.Uri;
        }
    }

    private void ApplyBody(ProxyRequestDto request, HttpRequestMessage httpRequest)
    {
        if (string.IsNullOrEmpty(request.Body))
        {
            return;
        }

        // Only allow body on methods that support it
        if (string.Equals(request.Method, HttpMethod.Get.Method, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(request.Method, HttpMethod.Delete.Method, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Request body is not allowed for GET/DELETE methods.");
        }

        httpRequest.Content = new StringContent(request.Body, Encoding.UTF8, "application/json");
    }

    private void InjectCredentials(string? credentialKey, HttpRequestMessage httpRequest)
    {
        if (string.IsNullOrWhiteSpace(credentialKey)) return;
        if (!_options.Credentials.TryGetValue(credentialKey, out var credential))
        {
            throw new InvalidOperationException($"Credential '{credentialKey}' is not configured.");
        }

        switch (credential.Type.ToLowerInvariant())
        {
            case "bearer":
                if (string.IsNullOrWhiteSpace(credential.Token))
                {
                    throw new InvalidOperationException("Bearer token is missing for the configured credential.");
                }
                httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", credential.Token);
                break;
            case "api_key":
                if (string.IsNullOrWhiteSpace(credential.ApiKey))
                {
                    throw new InvalidOperationException("API key is missing for the configured credential.");
                }
                var headerName = string.IsNullOrWhiteSpace(credential.ApiKeyHeader) ? "X-API-KEY" : credential.ApiKeyHeader;
                httpRequest.Headers.TryAddWithoutValidation(headerName!, credential.ApiKey);
                break;
            case "basic":
                if (string.IsNullOrWhiteSpace(credential.Username) || string.IsNullOrWhiteSpace(credential.Password))
                {
                    throw new InvalidOperationException("Username or password is missing for the configured credential.");
                }
                var raw = $"{credential.Username}:{credential.Password}";
                var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
                httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", encoded);
                break;
            default:
                throw new InvalidOperationException($"Unsupported credential type '{credential.Type}'.");
        }
    }

    private async Task EnsureResponseSizeWithinLimit(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        var maxBytes = _options.MaxResponseBytes > 0 ? _options.MaxResponseBytes : 1_000_000;
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);

        var buffer = new MemoryStream();
        var rented = new byte[8192];
        int read;
        while ((read = await stream.ReadAsync(rented.AsMemory(0, rented.Length), cancellationToken)) > 0)
        {
            if (buffer.Length + read > maxBytes)
            {
                throw new InvalidOperationException("Response exceeds the maximum allowed size.");
            }
            buffer.Write(rented, 0, read);
        }

        buffer.Position = 0;
        response.Content = new StreamContent(buffer);
        foreach (var header in response.Content.Headers.ToList())
        {
            response.Content.Headers.Remove(header.Key);
        }
        response.Content.Headers.ContentType = new MediaTypeHeaderValue(response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream");
    }

    private static bool IsSensitiveHeader(string headerName) =>
        headerName.Equals("Authorization", StringComparison.OrdinalIgnoreCase) ||
        headerName.StartsWith("Proxy-", StringComparison.OrdinalIgnoreCase);

    private static bool IsJson(string contentType) =>
        contentType.Contains("json", StringComparison.OrdinalIgnoreCase) || contentType == "application/json";
}

