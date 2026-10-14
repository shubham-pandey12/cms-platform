using Cms.Application.Services.Redirects;
using Xunit;

namespace Cms.Application.Tests.Redirects;

public sealed class RedirectPathNormalizerTests
{
    [Theory]
    [InlineData(null, "/")]
    [InlineData("", "/")]
    [InlineData("   ", "/")]
    public void Normalize_WhenNullOrWhitespace_ReturnsRoot(string? path, string expected)
    {
        Assert.Equal(expected, RedirectPathNormalizer.Normalize(path));
    }

    [Theory]
    [InlineData("/a?x=1", "/a")]
    [InlineData("/a#frag", "/a")]
    [InlineData("/a?x=1#y", "/a")]
    public void Normalize_StripsQueryAndFragment(string path, string expected)
    {
        Assert.Equal(expected, RedirectPathNormalizer.Normalize(path));
    }

    [Fact]
    public void Normalize_PrependsSlashWhenMissing()
    {
        Assert.Equal("/foo", RedirectPathNormalizer.Normalize("foo"));
    }

    [Theory]
    [InlineData("//a//b", "/a/b")]
    [InlineData("foo//bar", "/foo/bar")]
    public void Normalize_CollapsesDuplicateSlashes(string path, string expected)
    {
        Assert.Equal(expected, RedirectPathNormalizer.Normalize(path));
    }

    [Theory]
    [InlineData("/", "/")]
    [InlineData("/foo/", "/foo")]
    [InlineData("/foo/bar/", "/foo/bar")]
    public void Normalize_TrailingSlashExceptRoot(string path, string expected)
    {
        Assert.Equal(expected, RedirectPathNormalizer.Normalize(path));
    }

    [Fact]
    public void Normalize_TrimsWhitespace()
    {
        Assert.Equal("/x", RedirectPathNormalizer.Normalize("  /x/  "));
    }
}
