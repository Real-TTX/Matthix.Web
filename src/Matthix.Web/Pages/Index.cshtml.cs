using Matthix.Web.Content;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Matthix.Web.Pages;

public sealed class IndexModel : PageModel
{
    public SiteContent Site { get; }

    public IndexModel(SiteContent site) => Site = site;

    public void OnGet()
    {
    }
}
