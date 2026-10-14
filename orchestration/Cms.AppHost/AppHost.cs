using Microsoft.Extensions.Hosting;

var builder = DistributedApplication.CreateBuilder(args);

IResourceBuilder<IResourceWithConnectionString>? cmsDb;

if (builder.Environment.IsDevelopment())
{
    // DEV → Use Aspire Postgres container
    var postgres = builder.AddPostgres("postgres")
        .WithPgAdmin()
        .WithDataVolume("cms-postgres-data")
        .WithLifetime(ContainerLifetime.Persistent);

    cmsDb = postgres.AddDatabase("cmsdb");
}
else
{
    // PRODUCTION → Use external connection string (AWS RDS)
    cmsDb = builder.AddConnectionString("cmsdb");
}

// API
var api = builder.AddProject<Projects.Cms_Api>("cms-api")
    .WithReference(cmsDb);

if (builder.Environment.IsDevelopment())
{
    api.WaitFor(cmsDb);
}

//// Frontend (NPM)
//builder.AddNpmApp("frontend", "../../frontend", "dev")
//    .WithNpmPackageInstallation()
//    .WithHttpEndpoint(env: "PORT")
//    .WithExternalHttpEndpoints()
//    .WithReference(api);

await builder.Build().RunAsync();