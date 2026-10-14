using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.Filters;
using Cms.Application.Common.Interfaces;

namespace Cms.Api.Filters;

/// <summary>
/// Debug-only MVC diagnostics: controller/action and route parameters (no request bodies).
/// </summary>
public sealed class LoggingActionFilter : IAsyncActionFilter
{
    private readonly ILogger<LoggingActionFilter> _logger;
    private readonly ICurrentUser _currentUser;

    public LoggingActionFilter(ILogger<LoggingActionFilter> logger, ICurrentUser currentUser)
    {
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (!_logger.IsEnabled(LogLevel.Debug))
        {
            await next();
            return;
        }

        var sw = Stopwatch.StartNew();
        var routeValues = string.Join(
            ", ",
            context.ActionDescriptor.RouteValues.Select(kv => $"{kv.Key}={kv.Value}"));
        var query = context.HttpContext.Request.QueryString.Value ?? string.Empty;

        _logger.LogDebug(
            "Action entering {Controller}/{Action}. RouteValues={RouteValues}, Query={Query}, UserId={UserId}",
            context.RouteData.Values["controller"],
            context.RouteData.Values["action"],
            routeValues,
            query,
            _currentUser.UserId);

        var executed = await next();
        sw.Stop();

        if (executed.Exception is not null)
        {
            _logger.LogDebug(
                executed.Exception,
                "Action {Controller}/{Action} failed after {ElapsedMs} ms",
                context.RouteData.Values["controller"],
                context.RouteData.Values["action"],
                sw.ElapsedMilliseconds);
        }
        else
        {
            _logger.LogDebug(
                "Action {Controller}/{Action} completed in {ElapsedMs} ms",
                context.RouteData.Values["controller"],
                context.RouteData.Values["action"],
                sw.ElapsedMilliseconds);
        }
    }
}
