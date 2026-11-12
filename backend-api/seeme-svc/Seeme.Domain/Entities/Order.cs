using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Entities
{
    public class Order : BaseEntity
    {
        public int UserId { get; set; } // Người đặt hàng
        public int TotalPrice { get; set; } // Tổng giá trị đơn hàng
        public OrderType Type { get; set; } // Loại đơn hàng (ví dụ: Đặt mua cả cây trà và sản phẩm, Chỉ đặt mua cây trà, Chỉ đặt mua sản phẩm, v.v.)
        public string DeliveryInformation { get; set; } // Thông tin giao hàng (ví dụ: địa chỉ, số điện thoại liên hệ, v.v.)
        public bool PrePayment { get; set; } // Đơn thanh toán trước, áp dụng với đơn đặt mua cây trà
        public int TotalPayment { get; set; } // Tổng số tiền đã thanh toán (áp dụng với đơn đặt mua cây trà)
        public string? ReasonCancellation { get; set; } = string.Empty; // Lí do hủy đơn
    }

    public class DeliveryInformation
    {
        public string CustomerName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public DateTime? Birthday { get; set; }
    }
}
