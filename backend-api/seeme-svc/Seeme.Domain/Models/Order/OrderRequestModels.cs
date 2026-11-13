using Seeme.Domain.Extensions;
using System.Text.Json.Serialization;

namespace Seeme.Domain.Models.Order
{
    [JsonConverter(typeof(OrderDetailRequestConverter))]
    public abstract class OrderDetailRequest
    {
        public string Type { get; set; }
    }

    /// <summary>
    /// Request model để tạo đơn hàng mới
    /// </summary>
    public class CreateOrderRequestModel
    {
        /// <summary>
        /// Thông tin giao hàng (địa chỉ, số điện thoại, tên khách hàng, v.v.)
        /// </summary>
        public string DeliveryInformation { get; set; } = string.Empty;

        /// <summary>
        /// Danh sách chi tiết sản phẩm và cây trà trong đơn hàng
        /// </summary>
        public List<object> OrderDetails { get; set; } = new List<object>();

        /// <summary>
        /// Bằng chứng chuyển khoản Sepay (FE chỉ gửi khi socket Sepay đã xác nhận
        /// giao dịch vào: {id, content, transferAmount, transferType, ...}).
        /// Không có bằng chứng thì coi như chưa nhận tiền, kể cả khi khách đã bấm
        /// "Đã chuyển khoản" - đơn cây QR sẽ ở trạng thái "Chờ thanh toán" để
        /// admin đối soát tay thay vì bị ghi nhận "Đã thanh toán" oan.
        /// </summary>
        public System.Text.Json.JsonElement? SepayTransaction { get; set; }
    }

    /// <summary>
    /// Chi tiết sản phẩm trong đơn hàng
    /// </summary>
    public class OrderProductDetailRequest : OrderDetailRequest
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Price { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>
    /// Chi tiết cây trà trong đơn hàng
    /// </summary>
    public class OrderTeaDetailRequest : OrderDetailRequest
    {
        public int TeaId { get; set; }
        public string TeaName { get; set; } = string.Empty;
        public int Price { get; set; }
        public int Quantity { get; set; }
        public string? SpringHarvestName { get; set; } // Tên loại trà thu hoạch vụ xuân
        public string? SpringHarvestOutput { get; set; } // Sản lượng trà thu hoạch vụ xuân
        public string? WinterHarvestName { get; set; } // Tên loại trà thu hoạch vụ đông
        public string? WinterHarvestOutput { get; set; } // Sản lượng trà thu hoạch vụ đông
        // Thời gian nhận trồng
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
}