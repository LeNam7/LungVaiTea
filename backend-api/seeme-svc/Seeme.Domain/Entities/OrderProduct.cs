using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Entities
{
    public class OrderProduct : BaseEntity
    {
        public int Id { get; set; }
        public int OrderId { get; set; } // Mã đơn hàng
        public OrderProductStatus Status { get; set; } // Trạng thái cây trà (ví dụ: Chờ xác nhận, Đang chuẩn bị hàng, Hoàn thành, v.v.)

        // Json OrderProductDetailRequest
        public string? OrderDetails { get; set; }
    }
}
