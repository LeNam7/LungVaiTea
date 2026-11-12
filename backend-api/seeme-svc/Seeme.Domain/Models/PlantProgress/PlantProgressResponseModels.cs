using Seeme.Domain.Entities;

namespace Seeme.Domain.Models.PlantProgressModel;

public class PlantProgressResponse
{
    public int Id { get; set; }
    public int TeaId { get; set; }
    public int OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? Images { get; set; }
    public DateTime? CreatedDate { get; set; }
    public DateTime? UpdatedDate { get; set; }
}

public static class PlantProgressMapper
{
    public static PlantProgressResponse ToResponse(this Seeme.Domain.Entities.PlantProgress entity)
    {
        return new PlantProgressResponse
        {
            Id = entity.Id,
            TeaId = entity.TeaId,
            Title = entity.Titile,
            Content = entity.Content,
            Images = entity.Images,
            CreatedDate = entity.CreatedDate,
            UpdatedDate = entity.UpdatedDate
        };
    }

    public static List<PlantProgressResponse> ToResponseList(this IEnumerable<Seeme.Domain.Entities.PlantProgress> entities)
    {
        return entities.Select(ToResponse).ToList();
    }
}
