using Seeme.Domain.Entities;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.Order
{
    /// <summary>
    /// Response model khi tạo đơn hàng thành công
    /// </summary>
    public class OrderCreateResponseModel
    {
        public int OrderId { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool RequirePayment { get; set; }
        public int PaymentAmount { get; set; }
    }

    /// <summary>
    /// Response model cho danh sách đơn hàng
    /// </summary>
    public class OrderListResponseModel
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string OrderType { get; set; } = string.Empty;
        public int TotalPrice { get; set; }
        public bool PrePayment { get; set; }
        public int TotalPayment { get; set; }
        public string ReasonCancellation { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        /// <summary>Phương thức thanh toán rút từ DeliveryInformation ("cod"/"qr").
        /// Danh sách trước đây không có trường này nên cột PTTT ở CMS luôn gạch ngang.</summary>
        public string PaymentMethod { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response model cho chi tiết đơn hàng
    /// </summary>
    public class OrderDetailResponseModel
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string OrderType { get; set; } = string.Empty;
        public int TotalPrice { get; set; }
        public string DeliveryInformation { get; set; } = string.Empty;
        public bool PrePayment { get; set; }
        public int TotalPayment { get; set; }
        public string ReasonCancellation { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public OrderProductStatus? ProductStatus { get; set; }
        public OrderTeaStatus? TeaStatus { get; set; }
        public OrderTea? OrderTeaDetails { get; set; }
        public OrderProduct? OrderProductDetails { get; set; }
    }

    /// <summary>
    /// Response model cho danh sách đơn hàng cây trà
    /// </summary>
    public class OrderTeaListResponseModel
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int TotalPrice { get; set; }
        public bool PrePayment { get; set; }
        public int TotalPayment { get; set; }
        public DateTime CreatedDate { get; set; }
        public OrderTeaStatus Status { get; set; }
        public string? OrderDetails { get; set; }
    }

    /// <summary>
    /// Response model cho danh sách đơn hàng sản phẩm
    /// </summary>
    public class OrderProductListResponseModel
    {
        public int OrderId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string OrderType { get; set; } = string.Empty;
        public int TotalPrice { get; set; }
        public DateTime CreatedDate { get; set; }
        public OrderProductStatus Status { get; set; } // Trạng thái cây trà (ví dụ: Chờ xác nhận, Đang chuẩn bị hàng, Hoàn thành, v.v.)

        // Json OrderProductDetailRequest
        public string? OrderDetails { get; set; }
    }

    /// <summary>
    /// Response model cho lịch sử đặt hàng cây trà của khách hàng
    /// </summary>
    public class OrderTeaHistoryResponseModel
    {
        public int OrderTeaId { get; set; }
        public int OrderId { get; set; }
        public int TotalPrice { get; set; }
        public bool PrePayment { get; set; }
        public int TotalPayment { get; set; }
        public string DeliveryInformation { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public OrderTeaStatus Status { get; set; } // Trạng thái cây trà (ví dụ: Chờ xác nhận, Đang trồng, Hoàn thành, v.v.)
        public string ReasonCancellation { get; set; } = string.Empty;

        // Json OrderTeaDetailRequest
        public string? OrderDetails { get; set; }
    }

    /// <summary>
    /// Response model cho lịch sử đặt hàng sản phẩm của khách hàng
    /// </summary>
    public class OrderProductHistoryResponseModel
    {
        public int OrderId { get; set; }
        public int OrderProductId { get; set; }
        public int TotalPrice { get; set; }
        public int TotalPayment { get; set; }
        public string OrderType { get; set; }
        public string DeliveryInformation { get; set; }
        public OrderProductStatus Status { get; set; } // Trạng thái cây trà (ví dụ: Chờ xác nhận, Đang chuẩn bị hàng, Hoàn thành, v.v.)
        public string ReasonCancellation { get; set; } = string.Empty;

        // Json OrderTeaDetailRequest
        public string? OrderDetails { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }

    public class TeaOwnerResponseModel
    {
        public List<Tea> Teas { get; set; }
        // Json OrderTeaDetailRequest
        public List<OrderTea>? OrderDetails { get; set; }
    }
}