using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;

namespace Cms.Application.Services.Media;

internal enum MediaUploadEncoding
{
    None,
    Webp,
}

/// <summary>
/// Converts raster images to WebP (ImageSharp).
/// </summary>
internal static class MediaImageConverter
{
    public static MediaUploadEncoding ParseOutputFormat(string? outputFormat, string contentType)
    {
        if (string.IsNullOrWhiteSpace(outputFormat) ||
            outputFormat.Equals("original", StringComparison.OrdinalIgnoreCase))
        {
            return MediaUploadEncoding.None;
        }

        if (string.IsNullOrWhiteSpace(contentType))
        {
            return MediaUploadEncoding.None;
        }

        if (contentType.Contains("svg", StringComparison.OrdinalIgnoreCase))
        {
            return MediaUploadEncoding.None;
        }

        if (contentType.Equals("image/gif", StringComparison.OrdinalIgnoreCase))
        {
            return MediaUploadEncoding.None;
        }

        if (outputFormat.Equals("webp", StringComparison.OrdinalIgnoreCase))
        {
            return MediaUploadEncoding.Webp;
        }

        throw new InvalidOperationException(
            $"Unsupported output format '{outputFormat}'. Use original or webp.");
    }

    public static byte[] Encode(ReadOnlyMemory<byte> source, MediaUploadEncoding encoding, int quality)
    {
        var q = Math.Clamp(quality, 1, 100);
        try
        {
            return encoding switch
            {
                MediaUploadEncoding.Webp => EncodeWebP(source.Span, q),
                MediaUploadEncoding.None => throw new InvalidOperationException("No encoding was selected."),
                _ => throw new ArgumentOutOfRangeException(nameof(encoding)),
            };
        }
        catch (UnknownImageFormatException ex)
        {
            throw new InvalidOperationException(
                "Could not read the image bytes for conversion to the requested format.", ex);
        }
        catch (ImageFormatException ex)
        {
            throw new InvalidOperationException(
                "Could not read the image bytes for conversion to the requested format.", ex);
        }
    }

    private static byte[] EncodeWebP(ReadOnlySpan<byte> source, int quality)
    {
        using var image = Image.Load(source);
        using var ms = new MemoryStream();
        var encoder = new WebpEncoder { Quality = quality };
        image.SaveAsWebp(ms, encoder);
        return ms.ToArray();
    }
}
