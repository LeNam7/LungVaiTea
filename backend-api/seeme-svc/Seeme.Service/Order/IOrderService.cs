using Seeme.Domain.Constant;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Domain.Models.ReponseModel;

namespace Seeme.Service.OrderService
{
    public interface IOrderService
    {
        // Create Order
        Task<Response<OrderCreateResponseModel>> CreateOrderAsync(int userId, CreateOrderRequestModel request);

        // Update Order Status
        Task<Response<bool>> UpdateOrderProductStatusAsync(int orderProductId, Enumerations.OrderProductStatus status);
        Task<Response<bool>> UpdateOrderTeaStatusAsync(int orderTeaId, Enumerations.OrderTeaStatus status);
        Task<Response<bool>> CancelOrderAsync(int orderId, string reasonCancellation);

        // Get Order Details
        Task<Response<OrderDetailResponseModel>> GetOrderDetailAsync(int orderId);

        // Get Orders List
        Task<Response<PagingDataModel<OrderListResponseModel>>> GetOrdersPagingAsync(PaginationParam param, int? userId = null);
        Task<Response<PagingDataModel<OrderTeaListResponseModel>>> GetOrderTeasPagingAsync(PaginationParam param);
        Task<Response<PagingDataModel<OrderProductListResponseModel>>> GetOrderProductsPagingAsync(PaginationParam param);

        // Get Order Histories by UserId
        Task<Response<List<OrderTeaHistoryResponseModel>>> GetOrderTeaHistoriesAsync(int userId);
        Task<Response<List<OrderProductHistoryResponseModel>>> GetOrderProductHistoriesAsync(int userId);
    }
}
