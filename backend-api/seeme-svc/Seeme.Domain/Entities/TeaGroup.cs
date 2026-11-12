using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    // Nhóm trà (cấp cao hơn danh mục): Lục trà, Hồng trà, Bạch Trà, Phổ Nhĩ Sống, Set quà tặng.
    // Slug là khóa nghiệp vụ, unique, khớp đúng CategoryTea.Group đang dùng ở FE
    // nên không phải migrate dữ liệu danh mục cũ. Danh mục trỏ nhóm theo giá trị slug, không khóa ngoại.
    public class TeaGroup : BaseEntity
    {
        public string Slug { get; set; } = string.Empty; // Khóa nghiệp vụ, unique: luc-tra / hong-tra / bach-tra / pho-nhi-song / set-qua-tang
        public string Name { get; set; } = string.Empty; // Tên nhóm trà
        public string? Description { get; set; } // Mô tả nhóm trà hiển thị ở mega menu
        public string? ImageUrl { get; set; } // Ảnh đại diện nhóm trà
        public int SortOrder { get; set; } = 0; // Thứ tự hiển thị
        public bool IsActive { get; set; } = true; // Trạng thái hiển thị
    }
}
