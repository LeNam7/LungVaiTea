using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    // Cây trà
    public class Tea : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // Tên cây trà
        public string? NameEn { get; set; } // Tên cây trà tiếng Anh
        public string CategoryIds { get; set; } // Phân loại
        public int Price { get; set; }
        // Mã vườn
        public int GardenId { get; set; }
        public int YearOld { get; set; }
        public string? Description { get; set; } = string.Empty;
        public string? DescriptionEn { get; set; } // Mô tả tiếng Anh
        public decimal Long { get; set; } // Kinh độ
        public decimal Lat { get; set; } // Vĩ độ
        public string Aspect { get; set; } = string.Empty; // Tình trạng cây trà (ví dụ: khỏe mạnh, bị sâu bệnh, v.v.)
        public bool IsActive { get; set; } // Hiển thị
        public int PackageId { get; set; } // Gói thông tin thu hoạch được cấu hình sẵn
        public bool Sold { get; set; } = false; // Đã bán hay chưa
        public int Owner { get; set; } // Người sở hữu cây trà 
        public DateTime? OwnershipFromDate { get; set; } // Sở hữu từ ngày
        public DateTime? OwnershipToDate { get; set; } // Sở hữu đến ngày
        public string? Images { get; set; } // Ảnh cây trà
        public decimal Volume { get; set; } // Sản lượng
        public string? Type { get; set; } = string.Empty; // Loại cây 1 lá, 2 lá
        public string? TypeEn { get; set; } // Loại cây tiếng Anh
    }
}
