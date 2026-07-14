namespace Matthix.Web.Content;

/// <summary>
/// Central, data-driven content source for the site. Keeping the copy here
/// (instead of hard-coded in markup) makes the Razor views thin and the
/// content trivial to extend or translate later.
/// </summary>
public sealed class SiteContent
{
    public string BrandName => "MATTHIX";
    public string Tagline => "Plattformen. Netzwerke. Software.";
    public string Email => "hi@matthix.de";

    public string HeroLead =>
        "Ich plane, entwickle und stabilisiere technische Systeme an der Schnittstelle von " +
        "Platform Engineering, Enterprise Networking und produktionsnaher Softwareentwicklung.";

    public IReadOnlyList<NavItem> Navigation { get; } =
    [
        new("Leistung", "#leistung"),
        new("Projekte", "#projekte"),
        new("Referenzen", "#referenzen"),
        new("Kontakt", "#kontakt"),
    ];

    public string ServicesIntro =>
        "Ich verbinde Platform Design, Datenbank Design und Software Design mit produktionsnaher " +
        "Softwareentwicklung. Ziel sind Systeme, die fachliche Prozesse sauber abbilden, technisch " +
        "nachvollziehbar bleiben und sich im Betrieb weiterentwickeln lassen.";

    public IReadOnlyList<Service> Services { get; } =
    [
        new("01", "Platform Design",
            "Struktur, Module, Rollen, Schnittstellen und Betriebslogik für Plattformen, die mehr " +
            "können müssen als nur eine Oberfläche anzeigen."),
        new("02", "Datenbank Design",
            "Datenmodelle, Abfragen und Strukturen, die fachliche Prozesse abbilden und auch bei " +
            "Wachstum lesbar, wartbar und performant bleiben."),
        new("03", "Software Design",
            "Architekturentscheidungen, Komponenten und technische Konzepte, die Entwicklung, " +
            "Erweiterbarkeit und Betrieb zusammenbringen."),
        new("04", "Softwareentwicklung",
            "Umsetzung von Web-, Business- und Prozessplattformen mit Blick auf saubere Abläufe, " +
            "technische Stabilität und langfristige Wartbarkeit."),
    ];

    public IReadOnlyList<string> Stack { get; } =
    [
        "Proxmox", "UniFi", "Hyper-V", "MSSQL",
        "Platform Engineering", "Enterprise Networking", "Operations", "Development",
    ];

    public string ProjectsIntro =>
        "Eigene Produkte und Plattformen – überwiegend self-hosted, Docker-first und in C# / ASP.NET Core " +
        "entwickelt. Von Monitoring über Remote-Access bis zu digitalen Verwaltungsprozessen.";

    public IReadOnlyList<Project> Projects { get; } =
    [
        new("Matmon", "M", "#17c8d6", "Self-hosted Monitoring",
            "Leichtgewichtiges, Docker-first Monitoring als Alternative zu den großen Suiten: 60+ Sensortypen, " +
            "Probes hinter NAT, persistente Alarme, Live-Maps und Reports – auf dem eigenen Host, optional mit Cloud.",
            [".NET 10", "Docker", "Monitoring", "Self-hosted"],
            "https://matmon.eu", "https://github.com/Real-TTX/Matmon"),
        new("Schulio", "S", "#e0a83e", "Digitale Schulanmeldung",
            "Plattform für digitale Anmeldeverfahren an Schulen und Schulgruppen – inklusive nachgelagerter " +
            "Prüf-, Bearbeitungs- und Verwaltungsprozesse.",
            ["Plattform", "Prozessdigitalisierung", "SaaS"],
            "https://schulio.eu", null),
        new("Matdo", "M", "#8b7cf6", "Self-hosted Todo-Plattform",
            "Selbst gehostete Aufgaben-App als Mini-Plattform mit PWA: Projekte, Kanban-Boards, Etiketten, " +
            "Erinnerungen und das Teilen von Aufgaben – im Look an Todoist angelehnt.",
            ["ASP.NET Core", "PostgreSQL", "PWA", "Docker"],
            null, "https://github.com/Real-TTX/Matdo"),
        new("Matgate", "M", "#38c793", "Secure Access Gateway",
            "Self-hosted Gateway fürs Netzwerk: ein Web-UI und ein Login für RDP-, VNC- und SSH-Sessions, " +
            "Datei-Zugriff (SFTP/FTP/SMB) und Website-Proxy – auf Basis von Apache Guacamole.",
            ["C#", "Guacamole", "Remote Access", "Docker"],
            null, "https://github.com/Real-TTX/Matgate"),
        new("Matddns", "M", "#4aa3ff", "Universeller DynDNS-Updater",
            "DynDNS-Updater mit Web-UI: IP-Adressen aus vielen Quellen (UniFi, FRITZ!Box, DNS, …) beziehen und " +
            "DNS-Records bei Cloudflare, Hetzner, Netcup & Co. synchron halten – mit Failover und Dual-Stack.",
            ["C#", "DynDNS", "Networking", "Docker"],
            null, "https://github.com/Real-TTX/Matddns"),
    ];

    public IReadOnlyList<Reference> References { get; } =
    [
        new("AERA-Online", "Führende deutsche Dental-Plattform",
            "Technische Plattformarbeit für eine etablierte Lösung im Dentalmarkt: Strukturierung, " +
            "Architekturentscheidungen und Weiterentwicklung mit Fokus auf belastbare Prozesse.",
            ["Platform Design", "Architektur", "System Design"]),
        new("Topas-Hifi", "Renommierter Hifi-Händler",
            "Online-Shop und Beratung für einen renommierten Hifi-Händler, mit Fokus auf Produktlogik, " +
            "kaufmännische Abläufe und eine belastbare digitale Verkaufsstrecke.",
            ["Online-Shop", "E-Commerce", "Business Consulting"]),
    ];

    public string ContactHeadline =>
        "Wenn Technik klarer, stabiler oder belastbarer werden soll, sprechen wir.";

    public string ContactBody =>
        "Ob Plattform, Prozess, Infrastruktur oder technische Neuausrichtung: Ich steige dort ein, wo " +
        "Anforderungen konkret werden und Systeme verlässlich funktionieren müssen.";
}

public sealed record NavItem(string Label, string Href);

public sealed record Service(string Number, string Title, string Description);

/// <summary>A showcased own product/project.</summary>
/// <param name="Mark">Short glyph shown on the placeholder visual tile.</param>
/// <param name="Accent">Hex accent color used for the tile gradient.</param>
/// <param name="Website">Public site, or null if code-only.</param>
/// <param name="Repo">Source repository, or null if not public.</param>
public sealed record Project(
    string Name,
    string Mark,
    string Accent,
    string Tagline,
    string Description,
    IReadOnlyList<string> Tags,
    string? Website,
    string? Repo);

public sealed record Reference(string Client, string Title, string Description, IReadOnlyList<string> Tags);
