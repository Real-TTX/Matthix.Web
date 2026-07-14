using Matthix.Web.Content;

// Self-contained container health probe: `dotnet Matthix.Web.dll --healthcheck`
// pings the running instance and maps the result to a process exit code, so the
// runtime image needs no curl/wget.
if (args.Contains("--healthcheck"))
{
    try
    {
        var port = Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS") ?? "8080";
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        var response = await http.GetAsync($"http://localhost:{port}/health");
        return response.IsSuccessStatusCode ? 0 : 1;
    }
    catch
    {
        return 1;
    }
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();
builder.Services.AddSingleton<SiteContent>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
}

app.UseStaticFiles();
app.UseRouting();

app.MapRazorPages();

// Liveness endpoint used by the Docker HEALTHCHECK.
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
return 0;
