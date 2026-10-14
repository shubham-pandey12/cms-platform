namespace Cms.Application.DTOs.MockData;

public sealed record GalleryImageDto(Guid Id, string Src, string Alt, string Caption);

public sealed record DestinationDto(Guid Id, string Title, string Description, string Price, decimal Rating, string Image, string Link);

public sealed record FaqItemDto(Guid Id, string Question, string Answer);

public sealed record TravelPackageDto(Guid Id, string Name, string Description, string Price, string Duration, string Image, decimal Rating, string Location);

public sealed record SimpleDestinationDto(Guid Id, string Name, string Type, bool Featured);

// Response wrappers
public sealed record GalleryResponse(List<GalleryImageDto> Images, int Total, bool HasMore);
public sealed record DestinationsResponse(List<DestinationDto> Destinations, int Total, bool HasMore);
public sealed record FaqResponse(List<FaqItemDto> Faqs);
public sealed record PackagesResponse(List<TravelPackageDto> Packages);

