using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Entities
{
    // Sản phẩm trà
    public class Product : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // Tên sản phẩm
        public int CategoryId { get; set; } // Phân loại (danh mục cũ, giữ lại để tương thích dữ liệu cũ; tầng phân loại mới là GroupId)
        public string? GroupId { get; set; } // Slug nhóm trà (vd: luc-tra) — tầng phân loại duy nhất từ tái cấu trúc 1/11/2026, null = chưa phân nhóm
        public int Price { get; set; } // Giá sản phẩm
        public int Total { get; set; } // Số lượng còn tại kho
        public string Description { get; set; } = string.Empty; // Mô tả
        public string UserManual { get; set; } = string.Empty; // HDSD
        public string StorageInstructions { get; set; } = string.Empty; // HD bảo quản
        public bool IsActive { get; set; } // Trạng thái hiển thị
        public string Images { get; set; } = string.Empty; // Ảnh sản phẩm
        public int Quantity { get; set; } // Số lượng sản phẩm (gram của 1 đơn vị đóng gói)
        public string PackagingName { get; set; } = "Hộp"; // Tên bao bì / quy cách đóng gói (vd: Hộp thiếc vuông)
        public string VariantName { get; set; } = string.Empty; // Tên biến thể để phân biệt các biến thể cùng gram (vd: Loại 1, Thượng hạng)
        public bool IsGiftSet { get; set; } = false; // true = set quà tặng (không phải dòng trà thường)
        public string CollectionName { get; set; } = string.Empty; // Tên bộ sưu tập của set quà (vd: Huyền, An, Lộc)
        public string ColorOptions { get; set; } = string.Empty; // Các màu chọn của set quà, định dạng "Tên:#HEX;Tên:#HEX" (vd: Hồng:#D96C7A;Xanh lá:#3B5518;Kem:#DED1B9)
    }
}
