using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    /// <summary>
    /// Bảng tiến độ cây trồng
    /// </summary>
    public class PlantProgress : BaseEntity
    {
        // Id của cây trồng
        public int TeaId { get; set; }

        public string Titile { get; set; } = string.Empty;

        // Nội dung mô tả tiến độ cây trồng
        public string? Content { get; set; }

        // Mảng ảnh
        public string? Images { get; set; }
    }
}
