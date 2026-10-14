namespace Cms.Application.Services.Redirects;

/// <summary>
/// Normalizes URL paths for redirect matching:
/// trims whitespace, strips query/fragment, ensures leading slash,
/// collapses duplicate slashes, and strips trailing slash except root.
/// </summary>
public static class RedirectPathNormalizer
{
    public static string Normalize(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return "/";

        var t = path.Trim();
        var queryIdx = t.IndexOfAny(['?', '#']);
        if (queryIdx >= 0)
            t = t[..queryIdx];

        while (t.Contains("//", StringComparison.Ordinal))
            t = t.Replace("//", "/", StringComparison.Ordinal);

        if (!t.StartsWith('/'))
            t = "/" + t;

        if (t.Length > 1 && t.EndsWith('/'))
            t = t.TrimEnd('/');

        return t;
    }
}
