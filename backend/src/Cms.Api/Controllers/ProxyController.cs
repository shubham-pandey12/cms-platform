using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Cms.Api.Models.Proxy;
using Cms.Api.Options;
using Cms.Api.Services.Proxy;

namespace Cms.Api.Controllers;

[ApiController]
[Route("api/proxy")]
[Authorize]
public sealed class ProxyController : ControllerBase
{
    private readonly IProxyService _proxyService;
    private readonly ProxyOptions _options;

    public ProxyController(IProxyService proxyService, IOptions<ProxyOptions> options)
    {
        _proxyService = proxyService;
        _options = options.Value;
    }

    [HttpPost("execute")]
    public async Task<ActionResult<ProxyResponseDto>> Execute([FromBody] ProxyRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _proxyService.ExecuteAsync(request, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("config")]
    public ActionResult<object> GetConfig()
    {
        return Ok(new
        {
            allowedHosts = _options.AllowedHosts,
            baseUrls = _options.BaseUrls.Keys,
            credentialKeys = _options.Credentials.Keys
        });
    }
}

