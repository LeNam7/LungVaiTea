using System.ComponentModel.DataAnnotations;

namespace Seeme.Domain.Models.PlantProgressModel;

public class CreatePlantProgressRequest
{
    [Required]
    public int TeaId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }

    public string? Images { get; set; }
}

public class UpdatePlantProgressRequest
{
    [Required]
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Content { get; set; }

    public string? Images { get; set; }
}

public class GetPlantProgressByTeaAndOwnerRequest
{
    [Required]
    public int TeaId { get; set; }

    [Required]
    public int OwnerId { get; set; }
}
