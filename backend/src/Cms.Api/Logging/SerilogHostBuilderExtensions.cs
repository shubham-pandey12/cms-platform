using Amazon.CloudWatchLogs;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Json;
using Serilog.Sinks.AwsCloudWatch;

namespace Cms.Api.Logging;

/// <summary>
/// Configures Serilog for the API host (console from configuration, optional CloudWatch).
/// </summary>
public static class SerilogHostBuilderExtensions
{
    public static WebApplicationBuilder ConfigureCmsSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, services, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithEnvironmentName()
                .Enrich.With(services.GetRequiredService<HttpContextCorrelationIdEnricher>());

            var cwEnabled = context.Configuration.GetValue("Serilog:CloudWatch:Enabled", false);
            if (!cwEnabled)
            {
                return;
            }

            var logGroup = context.Configuration["Serilog:CloudWatch:LogGroup"]
                ?? $"/content-studio/{context.HostingEnvironment.EnvironmentName}";
            var regionName = context.Configuration["Serilog:CloudWatch:Region"];
            var client = string.IsNullOrWhiteSpace(regionName)
                ? new AmazonCloudWatchLogsClient()
                : new AmazonCloudWatchLogsClient(Amazon.RegionEndpoint.GetBySystemName(regionName));

            loggerConfiguration.WriteTo.AmazonCloudWatch(
                logGroup: logGroup,
                logStreamPrefix: context.HostingEnvironment.EnvironmentName.ToLowerInvariant(),
                textFormatter: new JsonFormatter(),
                restrictedToMinimumLevel: LogEventLevel.Information,
                cloudWatchClient: client);
        });

        return builder;
    }
}
