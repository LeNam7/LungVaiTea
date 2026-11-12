using System.ComponentModel;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models;

public class PaginationParam
{
    private int _pageSize = 20;

    /// <summary>
    /// Sắp xếp
    /// </summary>
    public string? OrderBy { get; set; }

    public string? Keyword { get; set; }

    public BlogType? Type { get; set; }

    public int? GardenId { get; set; }

    [DefaultValue(1)]
    public int PageIndex { get; set; } = 1;

    [DefaultValue(20)]
    public int PageSize
    {
        get => _pageSize > 500 ? 500 : _pageSize;
        set => _pageSize = value == 0 ? _pageSize : value;
    }
}
