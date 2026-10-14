using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Cms.Application.DTOs.Templates.Requests;
using Cms.Application.DTOs.Templates.Responses;
using Cms.Application.Interfaces.Services;
using System.Security.Claims;

namespace Cms.Api.Controllers;

/// <summary>
/// Manages templates.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class TemplatesController : ControllerBase
{
    private readonly ITemplateService _templateService;

    public TemplatesController(ITemplateService templateService)
    {
        _templateService = templateService;
    }

    /// <summary>
    /// Lists templates optionally filtered by brand.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<TemplateDto>>> GetAll([FromQuery] Guid? brandId, CancellationToken cancellationToken)
    {
        var templates = await _templateService.GetAllAsync(brandId, cancellationToken);
        return Ok(templates);
    }

    /// <summary>
    /// Creates a new template.
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TemplateDto>> Create([FromBody] CreateTemplateRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var template = await _templateService.CreateAsync(request, userId, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = template.Id }, template);
    }

    /// <summary>
    /// Updates an existing template.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<TemplateDto>> Update(Guid id, [FromBody] UpdateTemplateRequest request, CancellationToken cancellationToken)
    {
        var template = await _templateService.UpdateAsync(id, request, cancellationToken);
        return template is null ? NotFound() : Ok(template);
    }
}
