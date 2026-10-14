namespace Cms.Domain.Enums;

/// <summary>
/// Where the binary payload for a media item is stored.
/// </summary>
public enum MediaStorageProvider
{
    /// <summary>
    /// Remote URL only; no bytes in this system (e.g. seeded or third-party URLs).
    /// </summary>
    External = 0,

    /// <summary>
    /// Bytes stored in PostgreSQL.
    /// </summary>
    Database = 1,

    /// <summary>
    /// Object/blob storage (reserved for future use).
    /// </summary>
    Blob = 2,
}
