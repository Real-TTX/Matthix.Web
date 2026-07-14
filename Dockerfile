# syntax=docker/dockerfile:1

# ---- Build stage -------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (cached unless the project file changes).
COPY src/Matthix.Web/Matthix.Web.csproj src/Matthix.Web/
RUN dotnet restore src/Matthix.Web/Matthix.Web.csproj

# Copy the rest and publish a trimmed, framework-dependent build.
COPY src/ src/
RUN dotnet publish src/Matthix.Web/Matthix.Web.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# ---- Runtime stage -----------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# The aspnet base image ships a non-root "app" user; use it.
USER app

ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_gcServer=0

EXPOSE 8080

COPY --from=build /app/publish .

HEALTHCHECK --interval=30s --timeout=3s --start-period=8s --retries=3 \
    CMD ["dotnet", "Matthix.Web.dll", "--healthcheck"]

ENTRYPOINT ["dotnet", "Matthix.Web.dll"]
