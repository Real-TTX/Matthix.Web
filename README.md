# Matthix.Web

Persönliche CV-/Portfolio-Website von **MATTHIX** — *Plattformen. Netzwerke. Software.*

Neu aufgebaut als **ASP.NET Core 10 (Razor Pages)** mit modernem, dunklem Design
(Light/Dark-Toggle), datengetriebenen Inhalten und einem animierten Netzwerk-Hintergrund.
Ausgeliefert als Container auf Basis des offiziellen ASP.NET-Core-Images.

## Projektstruktur

```
src/Matthix.Web/
  Program.cs               Minimal-Host + Health-Endpoint + Container-Health-Probe
  Content/SiteContent.cs   Zentrale, datengetriebene Inhalte (Leistung, Referenzen, ...)
  Pages/                   Razor Pages (Index, Error) + Layout
  wwwroot/                 CSS, JS (Netzwerk-Canvas), Favicon
Dockerfile                 Multi-Stage-Build (SDK -> aspnet Runtime)
docker-compose.yml         Lokaler Start, Port 4500 -> 8080
.github/workflows/         CI: Docker-Build & Publish nach GHCR
```

## Lokal entwickeln (.NET SDK)

```bash
dotnet run --project src/Matthix.Web
# -> http://localhost:4500
```

## Lokal via Docker (Port 4500)

```bash
# Compose (empfohlen)
docker compose up --build
# -> http://localhost:4500

# oder manuell
docker build -t matthix-web .
docker run --rm -p 4500:8080 matthix-web
```

Health-Check: `GET /health` → `{"status":"healthy"}`

## CI/CD

`.github/workflows/docker-build.yml` baut das Image bei jedem Push/PR und veröffentlicht
es bei Push auf `main` (und für `v*`-Tags) in die GitHub Container Registry (`ghcr.io`).
Es werden keine zusätzlichen Secrets benötigt — die Anmeldung erfolgt über den
`GITHUB_TOKEN`.

## Inhalte pflegen

Texte, Leistungen und Referenzen liegen zentral in
[`SiteContent.cs`](src/Matthix.Web/Content/SiteContent.cs) — Markup bleibt davon unberührt.
