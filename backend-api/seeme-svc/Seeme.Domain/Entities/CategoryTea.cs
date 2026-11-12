using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    // Phân loại cây trà
    public class CategoryTea : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // Tên phân loại cây trà
        public string Group { get; set; } = string.Empty; // Nhóm trà: luc-tra / hong-tra / bach-tra / pho-nhi-song / set-qua-tang (khớp id nhóm ở FE) (để trống thì FE tự suy từ tên)
        public string Description { get; set; } = string.Empty; // Mô tả nhóm trà hiển thị ở mega menu
        public string? ImageUrl { get; set; } // Ảnh đại diện danh mục trà do admin cấu hình
        public bool IsActive { get; set; }
    }
}
