using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Cms.Application.Common.Security;
using Cms.Application;
using Cms.Application.Mapping;
using Cms.Application.Options;
using Cms.Application.Services.Auth;
using Cms.Api.Filters;
using Cms.Api.Logging;
using Cms.Api.Middleware;
using Cms.Api.Authorization;
using Cms.Api.Options;
using Cms.Api.Services.Proxy;
using Cms.Persistence;
using Cms.Persistence.Seeding;
using Cms.ServiceDefaults;
using Serilog;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add Persistence (DbContext + Identity)
builder.AddPersistence();

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<HttpContextCorrelationIdEnricher>();
builder.ConfigureCmsSerilog();

// Add services to the container
builder.Services.AddControllers(options => options.Filters.Add<LoggingActionFilter>())
    .AddApplicationPart(typeof(DatabaseSeeder).Assembly)
    .AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});
builder.Services.AddScoped<LoggingActionFilter>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "CMS API", Version = "v1" });

    var xmlPath = Path.Combine(AppContext.BaseDirectory, "Cms.Api.xml");
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Cms";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "CmsUsers";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PolicyCatalog.UsersRead, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.UsersRead)));
    options.AddPolicy(PolicyCatalog.UsersManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.UsersManage)));
    options.AddPolicy(PolicyCatalog.BrandsManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.BrandsManage)));
    options.AddPolicy(PolicyCatalog.RedirectsManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.RedirectsManage)));
    options.AddPolicy(PolicyCatalog.ThemesRead, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.ThemesRead)));
    options.AddPolicy(PolicyCatalog.ThemesManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.ThemesManage)));
    options.AddPolicy(PolicyCatalog.ThemesDelete, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.ThemesDelete)));
    options.AddPolicy(PolicyCatalog.RolesRead, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.RolesRead)));
    options.AddPolicy(PolicyCatalog.RolesManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.RolesManage)));
    options.AddPolicy(PolicyCatalog.MediaRead, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.MediaRead)));
    options.AddPolicy(PolicyCatalog.MediaManage, policy =>
        policy.Requirements.Add(new PermissionRequirement(PermissionCatalog.MediaManage)));
});
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

// Configure CORS for frontend for Now I am allowing Any origin, method, and header 
// but in future we will need to restrict it to only the allowed origins, methods, and headers
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register application services
builder.Services.AddApplication();

builder.Services.Configure<MediaOptions>(builder.Configuration.GetSection(MediaOptions.SectionName));

// MOS Gateway OAuth
builder.Services.Configure<MosGatewayOptions>(builder.Configuration.GetSection(MosGatewayOptions.SectionName));
builder.Services.Configure<ProxyOptions>(builder.Configuration.GetSection(ProxyOptions.SectionName));
builder.Services.AddHttpClient(nameof(ProxyService));
builder.Services.AddScoped<IProxyService, ProxyService>();
builder.Services
    .AddHttpClient(nameof(AuthService), client =>
    {
        // Keep this client independent from the 30s global resilience timeout.
        client.Timeout = TimeSpan.FromSeconds(90);
    })
    .ConfigureAdditionalHttpMessageHandlers((additionalHandlers, _) =>
    {
        // Remove default resilience handlers applied globally by AddServiceDefaults.
        var defaultResilienceHandlers = additionalHandlers
            .Where(handler => handler.GetType().FullName?.Contains("ResilienceHandler", StringComparison.Ordinal) == true)
            .ToList();

        foreach (var handler in defaultResilienceHandlers)
        {
            additionalHandlers.Remove(handler);
        }
    })
    .AddStandardResilienceHandler(options =>
    {
        options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(90);
    });

// IJwtService and ICurrentUser are registered in AddApplication().
// In-memory cache for read-heavy data (e.g. widget definitions, themes)
builder.Services.AddMemoryCache();

// Register database seeder
builder.Services.AddScoped<DatabaseSeeder>();

var app = builder.Build();

// Forwarded headers must run before other middleware so request host/proto reflect the proxy
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedHost | ForwardedHeaders.XForwardedProto,
});

MappingConfig.Register();
app.MapDefaultEndpoints();
if (app.Environment.IsDevelopment())
{
    app.MapHealthChecks("/dev/health");
}

// Ensure database is created and seeded
await app.Services.EnsureDatabaseCreatedAsync();

// Seed the database
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

// Configure the HTTP request pipeline
app.UseRouting();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseCors("Frontend");
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RequestLoggingMiddleware>();
app.MapControllers();

// Redirect root to Swagger when available (Development)
if (app.Environment.IsDevelopment())
{
    app.MapGet("/", () => Results.Redirect("/swagger", permanent: false));
}

try
{
    await app.RunAsync();
}
finally
{
    await Log.CloseAndFlushAsync();
}
