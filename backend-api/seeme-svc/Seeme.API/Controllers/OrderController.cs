using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Constant;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Service.OrderService;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/order")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        /// <summary>
        /// Tạo đơn hàng mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> CreateOrder([FromBody] CreateOrderRequestModel model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _orderService.CreateOrderAsync(currentUserId.Value, model);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }

                return StatusCode(StatusCodes.Status201Created, res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy chi tiết đơn hàng theo Id
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetOrderById(int id)
        {
            try
            {
                var res = await _orderService.GetOrderDetailAsync(id);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng phân trang (20 bản ghi/trang)
        /// </summary>
        [HttpPost("paging")]
        public async Task<ActionResult> GetOrdersPaging([FromBody] PaginationParam param)
        {
            try
            {
                // Optional: only return orders for current user by default
                var currentUserId = GetCurrentUserId();
                int? userId = currentUserId;

                var res = await _orderService.GetOrdersPagingAsync(param, userId);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        [HttpPost("teas/paging")]
        public async Task<ActionResult> GetOrderTeasPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _orderService.GetOrderTeasPagingAsync(param);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng sản phẩm phân trang (20 bản ghi/trang)
        /// </summary>
        [HttpPost("products/paging")]
        public async Task<ActionResult> GetOrderProductsPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _orderService.GetOrderProductsPagingAsync(param);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Cập nhật trạng thái cho item đơn sản phẩm
        /// </summary>
        [HttpPut("product-status/{orderProductId}")]
        public async Task<ActionResult> UpdateOrderProductStatus(int orderProductId, [FromBody] Enumerations.OrderProductStatus status)
        {
            try
            {
                var res = await _orderService.UpdateOrderProductStatusAsync(orderProductId, status);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Cập nhật trạng thái cho item đơn cây trà
        /// </summary>
        [HttpPut("tea-status/{orderTeaId}")]
        public async Task<ActionResult> UpdateOrderTeaStatus(int orderTeaId, [FromBody] Enumerations.OrderTeaStatus status)
        {
            try
            {
                var res = await _orderService.UpdateOrderTeaStatusAsync(orderTeaId, status);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Hủy đơn hàng với lý do
        /// </summary>
        [HttpPut("cancel/{orderId}")]
        public async Task<ActionResult> CancelOrder(int orderId, [FromBody] string reason)
        {
            try
            {
                var res = await _orderService.CancelOrderAsync(orderId, reason);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Cập nhật số tiền đã thanh toán của đơn hàng (admin đối soát tay)
        /// </summary>
        [HttpPut("payment/{orderId}")]
        public async Task<ActionResult> UpdateOrderPayment(int orderId, [FromBody] int totalPayment)
        {
            try
            {
                var res = await _orderService.UpdateOrderPaymentAsync(orderId, totalPayment);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy Lịch sử đơn hàng cây trà theo Id đơn hàng
        /// </summary>
        [HttpGet("teas/history")]
        public async Task<ActionResult> GetTeasHistory()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _orderService.GetOrderTeaHistoriesAsync(currentUserId.Value);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }

        /// <summary>
        /// Lấy Lịch sử đơn hàng cây trà theo Id đơn hàng
        /// </summary>
        [HttpGet("products/history")]
        public async Task<ActionResult> GetProductsHistory()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _orderService.GetOrderProductHistoriesAsync(currentUserId.Value);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace);
            }
        }
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("sub") ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}