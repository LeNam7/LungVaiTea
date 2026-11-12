using Seeme.Domain.Constant;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Domain.Models.ReponseModel;
using System.Linq.Expressions;
using System.Text.Json;

namespace Seeme.Service.OrderService
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderProductRepository _orderProductRepository;
        private readonly IOrderTeaRepository _orderTeaRepository;
        private readonly IUserAddressRepository _customerAddressRepository;
        private readonly IUserRepository _customerRepository;

        public OrderService(
            IOrderRepository orderRepository,
            IOrderProductRepository orderProductRepository,
            IOrderTeaRepository orderTeaRepository,
            IUserAddressRepository customerAddressRepository,
            IUserRepository customerRepository
        )
        {
            _orderRepository = orderRepository;
            _orderProductRepository = orderProductRepository;
            _orderTeaRepository = orderTeaRepository;
            _customerAddressRepository = customerAddressRepository;
            _customerRepository = customerRepository;
        }

        #region Create Order

        /// <summary>
        /// Đặt hàng mới - khách hàng có thể đặt cây trà, sản phẩm hoặc cả 2
        /// Nếu có cây trà phải thanh toán trước 100% giá trị đơn hàng
        /// </summary>
        public async Task<Response<OrderCreateResponseModel>> CreateOrderAsync(int userId, CreateOrderRequestModel request)
        {
            try
            {
                // Validate customer existence
                var customer = await _customerRepository.GetByIdAsync(userId);
                if (customer == null)
                {
                    return new Response<OrderCreateResponseModel>(404, "Khách hàng không tồn tại");
                }

                // Validate delivery information
                if (string.IsNullOrWhiteSpace(request.DeliveryInformation))
                {
                    return new Response<OrderCreateResponseModel>(400, "Thông tin giao hàng không được để trống");
                }

                // Validate order type
                if (request.OrderDetails == null || request.OrderDetails.Count == 0)
                {
                    return new Response<OrderCreateResponseModel>(400, "Đơn hàng phải có ít nhất một sản phẩm hoặc cây trà");
                }

                // Determine order type and calculate total price
                var hasTeaItems = request.OrderDetails
                    .OfType<JsonElement>()
                    .Any(e => e.TryGetProperty("Type", out var t) &&
                              t.GetString()?.ToLower() == "tea");

                var hasProductItems = request.OrderDetails
                    .OfType<JsonElement>()
                    .Any(e => e.TryGetProperty("Type", out var t) &&
                              t.GetString()?.ToLower() == "product");

                Enumerations.OrderType orderType = hasTeaItems && hasProductItems
                    ? Enumerations.OrderType.Both
                    : hasTeaItems ? Enumerations.OrderType.Tea : Enumerations.OrderType.Product;

                int totalPrice = CalculateTotalPrice(request.OrderDetails);

                if (totalPrice <= 0)
                {
                    return new Response<OrderCreateResponseModel>(400, "Tổng giá trị đơn hàng phải lớn hơn 0");
                }

                // Create order
                var order = new Order
                {
                    UserId = userId,
                    TotalPrice = totalPrice,
                    Type = orderType,
                    DeliveryInformation = request.DeliveryInformation,
                    PrePayment = hasTeaItems, // Cây trà phải thanh toán trước
                    TotalPayment = hasTeaItems ? totalPrice : 0, // Nếu có cây trà, khách hàng phải thanh toán 100%
                    CreatedDate = DateTime.Now,
                    IsDelete = false
                };

                var createdOrder = await _orderRepository.CreateAsync(order);

                // Create order products if any
                if (hasProductItems)
                {
                    var orderProduct = new OrderProduct
                    {
                        OrderId = createdOrder.Id,
                        Status = Enumerations.OrderProductStatus.Approved,
                        OrderDetails = JsonSerializer.Serialize(request.OrderDetails),
                        CreatedDate = DateTime.Now,
                        IsDelete = false
                    };
                    await _orderProductRepository.CreateAsync(orderProduct);
                }

                // Create order teas if any
                if (hasTeaItems)
                {
                    var orderTea = new OrderTea
                    {
                        OrderId = createdOrder.Id,
                        Status = Enumerations.OrderTeaStatus.Approved,
                        OrderDetails = JsonSerializer.Serialize(request.OrderDetails),
                        CreatedDate = DateTime.Now,
                        IsDelete = false
                    };
                    await _orderTeaRepository.CreateAsync(orderTea);
                }

                return new Response<OrderCreateResponseModel>(
                    new OrderCreateResponseModel
                    {
                        OrderId = createdOrder.Id,
                        Message = "Đơn hàng được tạo thành công",
                        RequirePayment = hasTeaItems,
                        PaymentAmount = hasTeaItems ? totalPrice : 0
                    }
                );
            }
            catch (Exception ex)
            {
                return new Response<OrderCreateResponseModel>(500, $"Lỗi khi tạo đơn hàng: {ex.Message}");
            }
        }

        #endregion

        #region Update Order Status

        /// <summary>
        /// Cập nhật trạng thái đơn hàng sản phẩm
        /// </summary>
        public async Task<Response<bool>> UpdateOrderProductStatusAsync(int orderProductId, Enumerations.OrderProductStatus status)
        {
            try
            {
                var orderProduct = await _orderProductRepository.GetByIdAsync(orderProductId);
                if (orderProduct == null)
                {
                    return new Response<bool>(404, "Đơn hàng sản phẩm không tồn tại");
                }

                orderProduct.Status = status;
                orderProduct.UpdatedDate = DateTime.Now;
                await _orderProductRepository.UpdateAsync(orderProduct);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi cập nhật trạng thái: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật trạng thái đơn hàng cây trà
        /// </summary>
        public async Task<Response<bool>> UpdateOrderTeaStatusAsync(int orderTeaId, Enumerations.OrderTeaStatus status)
        {
            try
            {
                var orderTea = await _orderTeaRepository.GetByIdAsync(orderTeaId);
                if (orderTea == null)
                {
                    return new Response<bool>(404, "Đơn hàng cây trà không tồn tại");
                }

                orderTea.Status = status;
                orderTea.UpdatedDate = DateTime.Now;
                await _orderTeaRepository.UpdateAsync(orderTea);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi cập nhật trạng thái: {ex.Message}");
            }
        }

        /// <summary>
        /// Hủy đơn hàng với lý do
        /// </summary>
        public async Task<Response<bool>> CancelOrderAsync(int orderId, string reasonCancellation)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new Response<bool>(404, "Đơn hàng không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(reasonCancellation))
                {
                    return new Response<bool>(400, "Lý do hủy đơn không được để trống");
                }

                order.ReasonCancellation = reasonCancellation;
                order.UpdatedDate = DateTime.Now;

                // Cancel all product items in order
                var orderProducts = _orderProductRepository.GetListAsync(op => op.OrderId == orderId && !op.IsDelete);
                foreach (var op in orderProducts)
                {
                    op.Status = Enumerations.OrderProductStatus.Canceled;
                    op.UpdatedDate = DateTime.Now;
                    await _orderProductRepository.UpdateAsync(op);
                }

                // Cancel all tea items in order
                var orderTeas = _orderTeaRepository.GetListAsync(ot => ot.OrderId == orderId && !ot.IsDelete);
                foreach (var ot in orderTeas)
                {
                    ot.Status = Enumerations.OrderTeaStatus.Completed; // For tea, there's no Canceled status, mark as Completed
                    ot.UpdatedDate = DateTime.Now;
                    await _orderTeaRepository.UpdateAsync(ot);
                }

                await _orderRepository.UpdateAsync(order);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi hủy đơn hàng: {ex.Message}");
            }
        }

        #endregion

        #region Get Order Details

        /// <summary>
        /// Lấy thông tin chi tiết đơn hàng
        /// </summary>
        public async Task<Response<OrderDetailResponseModel>> GetOrderDetailAsync(int orderId)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new Response<OrderDetailResponseModel>(404, "Đơn hàng không tồn tại");
                }

                var customer = await _customerRepository.GetByIdAsync(order.UserId);

                var orderProducts = await _orderProductRepository.GetAsync(op => op.OrderId == orderId && !op.IsDelete);
                var orderTeas = await _orderTeaRepository.GetAsync(ot => ot.OrderId == orderId && !ot.IsDelete);

                var response = new OrderDetailResponseModel
                {
                    OrderId = order.Id,
                    CustomerId = order.UserId,
                    CustomerName = customer?.FullName ?? string.Empty,
                    CustomerEmail = customer?.Email ?? string.Empty,
                    CustomerPhone = customer?.PhoneNumber ?? string.Empty,
                    OrderType = order.Type.ToString(),
                    TotalPrice = order.TotalPrice,
                    DeliveryInformation = order.DeliveryInformation,
                    PrePayment = order.PrePayment,
                    TotalPayment = order.TotalPayment,
                    ReasonCancellation = order.ReasonCancellation ?? string.Empty,
                    CreatedDate = order.CreatedDate ?? DateTime.Now,
                    ProductStatus = orderProducts != null ? orderProducts.Status : null,
                    TeaStatus = orderTeas != null ? orderTeas.Status : null,
                    OrderTeaDetails = orderTeas,
                    OrderProductDetails = orderProducts
                };

                return new Response<OrderDetailResponseModel>(response);
            }
            catch (Exception ex)
            {
                return new Response<OrderDetailResponseModel>(500, $"Lỗi khi lấy thông tin đơn hàng: {ex.Message}");
            }
        }

        #endregion

        #region Get Orders List

        /// <summary>
        /// Lấy danh sách đơn hàng phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<OrderListResponseModel>>> GetOrdersPagingAsync(PaginationParam param, int? userId = null)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                Expression<Func<Order, bool>>? filter = null;

                if (userId.HasValue && userId.Value > 0)
                {
                    filter = o => o.UserId == userId.Value && !o.IsDelete;
                }
                else
                {
                    filter = o => !o.IsDelete;
                }

                var pagingData = await _orderRepository.GetPagingAsync<Order>(paginationParam, filter);

                var resultData = new PagingDataModel<OrderListResponseModel>
                {
                    Data = new List<OrderListResponseModel>(),
                    TotalPages = pagingData.TotalPages,
                    TotalRecords = pagingData.TotalRecords
                };

                foreach (var order in pagingData.Data)
                {
                    var customer = await _customerRepository.GetByIdAsync(order.UserId);
                    resultData.Data.Add(new OrderListResponseModel
                    {
                        OrderId = order.Id,
                        CustomerName = customer?.FullName ?? "N/A",
                        OrderType = order.Type.ToString(),
                        TotalPrice = order.TotalPrice,
                        PrePayment = order.PrePayment,
                        TotalPayment = order.TotalPayment,
                        CreatedDate = order.CreatedDate ?? DateTime.Now
                    });
                }

                return new Response<PagingDataModel<OrderListResponseModel>>(resultData);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<OrderListResponseModel>>(500, $"Lỗi khi lấy danh sách đơn hàng: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<OrderTeaListResponseModel>>> GetOrderTeasPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                // Get orders with tea items
                var teaOrderIds = _orderTeaRepository.GetListAsync(ot => !ot.IsDelete)
                    .Select(ot => ot.OrderId)
                    .Distinct()
                    .ToList();

                Expression<Func<Order, bool>> filter = o => teaOrderIds.Contains(o.Id) && !o.IsDelete;

                var pagingData = await _orderRepository.GetPagingAsync<Order>(paginationParam, filter);

                var resultData = new PagingDataModel<OrderTeaListResponseModel>
                {
                    Data = new List<OrderTeaListResponseModel>(),
                    TotalPages = pagingData.TotalPages,
                    TotalRecords = pagingData.TotalRecords
                };

                if (pagingData != null && pagingData.Data.Any())
                {
                    foreach (var order in pagingData.Data)
                    {
                        var customer = await _customerRepository.GetByIdAsync(order.UserId);
                        var orderTeas = await _orderTeaRepository.GetAsync(ot => ot.OrderId == order.Id && !ot.IsDelete);

                        resultData.Data.Add(new OrderTeaListResponseModel
                        {
                            OrderId = order.Id,
                            CustomerName = customer?.FullName ?? "N/A",
                            TotalPrice = order.TotalPrice,
                            PrePayment = order.PrePayment,
                            TotalPayment = order.TotalPayment,
                            Status = orderTeas.Status,
                            OrderDetails = orderTeas.OrderDetails,
                            CreatedDate = order.CreatedDate ?? DateTime.Now
                        });
                    }
                }

                return new Response<PagingDataModel<OrderTeaListResponseModel>>(resultData);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<OrderTeaListResponseModel>>(500, $"Lỗi khi lấy danh sách đơn hàng cây: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng sản phẩm phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<OrderProductListResponseModel>>> GetOrderProductsPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                // Get orders with product items
                var productOrderIds = _orderProductRepository.GetListAsync(op => !op.IsDelete)
                    .Select(op => op.OrderId)
                    .Distinct()
                    .ToList();

                Expression<Func<Order, bool>> filter = o => productOrderIds.Contains(o.Id) && !o.IsDelete;

                var pagingData = await _orderRepository.GetPagingAsync<Order>(paginationParam, filter);

                var resultData = new PagingDataModel<OrderProductListResponseModel>
                {
                    Data = new List<OrderProductListResponseModel>(),
                    TotalPages = pagingData.TotalPages,
                    TotalRecords = pagingData.TotalRecords
                };

                if (pagingData != null && pagingData.Data.Any())
                {
                    foreach (var order in pagingData.Data)
                    {
                        var customer = await _customerRepository.GetByIdAsync(order.UserId);
                        var orderProduct = await _orderProductRepository.GetAsync(op => op.OrderId == order.Id && !op.IsDelete);

                        if (orderProduct != null)
                        {
                            resultData.Data.Add(new OrderProductListResponseModel
                            {
                                OrderId = order.Id,
                                CustomerName = customer?.FullName ?? "N/A",
                                OrderType = order.Type.ToString(),
                                TotalPrice = order.TotalPrice,
                                OrderDetails = orderProduct?.OrderDetails,
                                Status = orderProduct.Status,
                                CreatedDate = order.CreatedDate ?? DateTime.Now
                            });
                        }
                    }
                }

                return new Response<PagingDataModel<OrderProductListResponseModel>>(resultData);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<OrderProductListResponseModel>>(500, $"Lỗi khi lấy danh sách đơn hàng sản phẩm: {ex.Message}");
            }
        }

        #endregion

        #region Get Order Details

        /// <summary>
        /// Lấy danh sách lịch sử đặt hàng cây trà của khách hàng
        /// </summary>
        public async Task<Response<List<OrderTeaHistoryResponseModel>>> GetOrderTeaHistoriesAsync(int userId)
        {
            try
            {
                var customer = await _customerRepository.GetByIdAsync(userId);
                if (customer == null)
                {
                    return new Response<List<OrderTeaHistoryResponseModel>>(404, "Khách hàng không tồn tại");
                }

                // Get all orders for the user
                var userOrders = _orderRepository.GetListAsync(o => o.UserId == userId && !o.IsDelete).ToList();

                if (userOrders.Count == 0)
                {
                    return new Response<List<OrderTeaHistoryResponseModel>>(new List<OrderTeaHistoryResponseModel>());
                }

                var orderIds = userOrders.Select(o => o.Id).ToList();
                var orderTeas = _orderTeaRepository.GetListAsync(ot => orderIds.Contains(ot.OrderId) && !ot.IsDelete).ToList();

                var result = new List<OrderTeaHistoryResponseModel>();

                foreach (var orderTea in orderTeas)
                {
                    var order = userOrders.FirstOrDefault(o => o.Id == orderTea.OrderId);
                    if (order != null)
                    {
                        result.Add(new OrderTeaHistoryResponseModel
                        {
                            OrderTeaId = orderTea.Id,
                            OrderId = orderTea.OrderId,
                            Status = orderTea.Status,
                            TotalPrice = order.TotalPrice,
                            PrePayment = order.PrePayment,
                            TotalPayment = order.TotalPayment,
                            DeliveryInformation = order.DeliveryInformation,
                            OrderDetails = orderTea.OrderDetails,
                            CreatedDate = orderTea.CreatedDate ?? DateTime.Now,
                            UpdatedDate = orderTea.UpdatedDate
                        });
                    }
                }

                return new Response<List<OrderTeaHistoryResponseModel>>(result.OrderByDescending(x => x.CreatedDate).ToList());
            }
            catch (Exception ex)
            {
                return new Response<List<OrderTeaHistoryResponseModel>>(500, $"Lỗi khi lấy lịch sử đặt hàng cây: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách lịch sử đặt hàng sản phẩm của khách hàng
        /// </summary>
        public async Task<Response<List<OrderProductHistoryResponseModel>>> GetOrderProductHistoriesAsync(int userId)
        {
            try
            {
                var customer = await _customerRepository.GetByIdAsync(userId);
                if (customer == null)
                {
                    return new Response<List<OrderProductHistoryResponseModel>>(404, "Khách hàng không tồn tại");
                }

                // Get all orders for the user
                var userOrders = _orderRepository.GetListAsync(o => o.UserId == userId && !o.IsDelete).ToList();

                if (userOrders.Count == 0)
                {
                    return new Response<List<OrderProductHistoryResponseModel>>(new List<OrderProductHistoryResponseModel>());
                }

                var orderIds = userOrders.Select(o => o.Id).ToList();
                var orderProducts = _orderProductRepository.GetListAsync(op => orderIds.Contains(op.OrderId) && !op.IsDelete).ToList();

                var result = new List<OrderProductHistoryResponseModel>();

                foreach (var orderProduct in orderProducts)
                {
                    var order = userOrders.FirstOrDefault(o => o.Id == orderProduct.OrderId);
                    if (order != null)
                    {
                        result.Add(new OrderProductHistoryResponseModel
                        {
                            OrderProductId = orderProduct.Id,
                            OrderId = orderProduct.OrderId,
                            TotalPrice = order.TotalPrice,
                            OrderType = order.Type.ToString(),
                            DeliveryInformation = order.DeliveryInformation,
                            Status = orderProduct.Status,
                            OrderDetails = orderProduct.OrderDetails,
                            CreatedDate = orderProduct.CreatedDate ?? DateTime.Now,
                            UpdatedDate = orderProduct.UpdatedDate
                        });
                    }
                }

                return new Response<List<OrderProductHistoryResponseModel>>(result.OrderByDescending(x => x.CreatedDate).ToList());
            }
            catch (Exception ex)
            {
                return new Response<List<OrderProductHistoryResponseModel>>(500, $"Lỗi khi lấy lịch sử đặt hàng sản phẩm: {ex.Message}");
            }
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Tính tổng giá trị đơn hàng từ danh sách chi tiết sản phẩm/cây
        /// </summary>
        private int CalculateTotalPrice(List<object> orderDetails)
        {
            int total = 0;

            foreach (var detail in orderDetails)
            {
                if (detail is JsonElement jsonElement)
                {
                    var type = jsonElement.GetProperty("Type").GetString();

                    if (type == "product")
                    {
                        var product = jsonElement.Deserialize<OrderProductDetailRequest>();
                        total += product.Price * product.Quantity;
                    }
                    else if (type == "tea")
                    {
                        var tea = jsonElement.Deserialize<OrderTeaDetailRequest>();
                        total += tea.Price * tea.Quantity;
                    }
                }
            }

            return total;
        }

        #endregion
    }
}