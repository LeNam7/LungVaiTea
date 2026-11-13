using Seeme.Domain.Constant;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Domain.Models.ReponseModel;
using System.Linq.Expressions;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Seeme.Service.OrderService
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderProductRepository _orderProductRepository;
        private readonly IOrderTeaRepository _orderTeaRepository;
        private readonly IUserAddressRepository _customerAddressRepository;
        private readonly IUserRepository _customerRepository;
        private readonly ITeaRepository _teaRepository;
        private readonly IProductRepository _productRepository;

        public OrderService(
            IOrderRepository orderRepository,
            IOrderProductRepository orderProductRepository,
            IOrderTeaRepository orderTeaRepository,
            IUserAddressRepository customerAddressRepository,
            IUserRepository customerRepository,
            ITeaRepository teaRepository,
            IProductRepository productRepository
        )
        {
            _orderRepository = orderRepository;
            _orderProductRepository = orderProductRepository;
            _orderTeaRepository = orderTeaRepository;
            _customerAddressRepository = customerAddressRepository;
            _customerRepository = customerRepository;
            _teaRepository = teaRepository;
            _productRepository = productRepository;
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

                // Phương thức thanh toán nằm trong DeliveryInformation (FE gửi kèm lúc đặt hàng).
                // COD thì chưa thu đồng nào, kể cả đơn cây trà; QR + cây trà thì trả trước 100%.
                var paymentMethod = string.Empty;
                try
                {
                    using var deliveryDoc = JsonDocument.Parse(request.DeliveryInformation);
                    if (deliveryDoc.RootElement.TryGetProperty("paymentMethod", out var methodElement))
                    {
                        paymentMethod = methodElement.GetString()?.ToLowerInvariant() ?? string.Empty;
                    }
                }
                catch
                {
                    // DeliveryInformation không phải JSON hợp lệ: giữ nguyên hành vi cũ phía dưới.
                }
                var isCod = paymentMethod == "cod";

                // Cây trà đã bán thì không được bán lại: chặn ngay trước khi tạo đơn.
                var orderedTeaIds = request.OrderDetails
                    .OfType<JsonElement>()
                    .Where(e => e.TryGetProperty("Type", out var t) &&
                                t.GetString()?.ToLower() == "tea" &&
                                e.TryGetProperty("TeaId", out var idElement) &&
                                idElement.TryGetInt32(out _))
                    .Select(e => e.GetProperty("TeaId").GetInt32())
                    .Distinct()
                    .ToList();
                foreach (var teaId in orderedTeaIds)
                {
                    var existingTea = await _teaRepository.GetByIdAsync(teaId);
                    if (existingTea != null && existingTea.Sold)
                    {
                        return new Response<OrderCreateResponseModel>(400, $"Cây trà {existingTea.Name} đã được bán, không thể đặt mua lại");
                    }
                }

                // Bằng chứng chuyển khoản Sepay thật: FE chỉ gửi kèm khi socket Sepay
                // đã xác nhận giao dịch vào (transferType = "in", số tiền đủ tổng đơn).
                // Khách bấm "Đã chuyển khoản" nhưng chưa chuyển (FE gửi null) thì đơn cây
                // QR KHÔNG được ghi nhận đã trả tiền - để "Chờ thanh toán" cho admin
                // đối soát tay, thay vì tự thành "Đã thanh toán" như trước.
                var hasSepayConfirmation = false;
                if (request.SepayTransaction.HasValue &&
                    request.SepayTransaction.Value.ValueKind == JsonValueKind.Object)
                {
                    var tx = request.SepayTransaction.Value;
                    var amountOk = (tx.TryGetProperty("transferAmount", out var amountElement) ||
                                    tx.TryGetProperty("TransferAmount", out amountElement)) &&
                                   amountElement.TryGetInt32(out var transferAmount) &&
                                   transferAmount >= totalPrice;
                    var typeOk = (tx.TryGetProperty("transferType", out var typeElement) ||
                                  tx.TryGetProperty("TransferType", out typeElement)) &&
                                 string.Equals(typeElement.GetString(), "in", StringComparison.OrdinalIgnoreCase);
                    hasSepayConfirmation = amountOk && typeOk;
                }

                // Đơn thanh toán quốc tế qua cổng Stripe hoặc PayPal (đã thanh toán thành công trước khi gọi API tạo đơn)
                var isInternationalPaid = paymentMethod == "stripe" || paymentMethod == "paypal";
                var isPaid = isInternationalPaid || hasSepayConfirmation;

                // Create order
                var order = new Order
                {
                    UserId = userId,
                    TotalPrice = totalPrice,
                    Type = orderType,
                    DeliveryInformation = request.DeliveryInformation,
                    PrePayment = (hasTeaItems && !isCod) || isInternationalPaid || hasSepayConfirmation,
                    TotalPayment = isCod ? 0 : (isPaid ? totalPrice : 0),
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

                    // Cây đã có đơn thì coi là đã bán + ẩn khỏi trang bán để không bán trùng.
                    foreach (var teaId in orderedTeaIds)
                    {
                        var tea = await _teaRepository.GetByIdAsync(teaId);
                        if (tea == null) continue;
                        tea.Sold = true;
                        tea.IsActive = false;
                        tea.UpdatedDate = DateTime.Now;
                        await _teaRepository.UpdateAsync(tea);
                    }
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

                // Đơn hủy thì cây trở lại trạng thái chưa bán + hiện lại để bán tiếp.
                foreach (var ot in orderTeas)
                {
                    if (string.IsNullOrWhiteSpace(ot.OrderDetails)) continue;
                    try
                    {
                        using var detailsDoc = JsonDocument.Parse(ot.OrderDetails);
                        if (detailsDoc.RootElement.ValueKind != JsonValueKind.Array) continue;
                        foreach (var element in detailsDoc.RootElement.EnumerateArray())
                        {
                            if (!element.TryGetProperty("Type", out var typeElement) ||
                                typeElement.GetString()?.ToLower() != "tea" ||
                                !element.TryGetProperty("TeaId", out var teaIdElement) ||
                                !teaIdElement.TryGetInt32(out var teaId))
                            {
                                continue;
                            }
                            var tea = await _teaRepository.GetByIdAsync(teaId);
                            if (tea == null) continue;
                            tea.Sold = false;
                            tea.IsActive = true;
                            tea.UpdatedDate = DateTime.Now;
                            await _teaRepository.UpdateAsync(tea);
                        }
                    }
                    catch
                    {
                        // Chi tiết đơn hỏng: bỏ qua cây đó, đơn vẫn hủy bình thường.
                    }
                }

                await _orderRepository.UpdateAsync(order);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi hủy đơn hàng: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật số tiền đã thanh toán của đơn hàng (admin đối soát tay:
        /// đơn QR chờ thanh toán hoặc đơn COD đã thu tiền mặt).
        /// </summary>
        public async Task<Response<bool>> UpdateOrderPaymentAsync(int orderId, int totalPayment)
        {
            try
            {
                var order = await _orderRepository.GetByIdAsync(orderId);
                if (order == null)
                {
                    return new Response<bool>(404, "Đơn hàng không tồn tại");
                }

                if (totalPayment < 0 || totalPayment > order.TotalPrice)
                {
                    return new Response<bool>(400, "Số tiền thanh toán phải từ 0 đến tổng giá trị đơn hàng");
                }

                order.TotalPayment = totalPayment;
                order.UpdatedDate = DateTime.Now;

                await _orderRepository.UpdateAsync(order);

                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi cập nhật thanh toán: {ex.Message}");
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
                        ReasonCancellation = order.ReasonCancellation ?? string.Empty,
                        CreatedDate = order.CreatedDate ?? DateTime.Now,
                        PaymentMethod = ExtractPaymentMethod(order.DeliveryInformation)
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
        /// <summary>
        /// Gắn ảnh sản phẩm/cây vào từng chi tiết trong OrderDetails của lịch sử đơn.
        /// Trước đây OrderDetails chỉ có thông tin lúc đặt hàng, không có ảnh nên FE
        /// lịch sử rơi về 1 ảnh mặc định cây trà cho mọi dòng. Chỉ enrich chuỗi JSON
        /// trả về, không sửa dữ liệu gốc; chi tiết nào không tra được ảnh (sản phẩm
        /// hoặc cây đã xóa) thì giữ nguyên để FE tự fallback.
        /// </summary>
        private static List<int> CollectDetailIds(string? orderDetailsJson, string idProperty)
        {
            var ids = new List<int>();
            if (string.IsNullOrWhiteSpace(orderDetailsJson)) return ids;
            JsonNode? root;
            try
            {
                root = JsonNode.Parse(orderDetailsJson);
            }
            catch
            {
                return ids;
            }
            if (root is not JsonArray details) return ids;
            foreach (var node in details)
            {
                if (node is JsonObject detail && TryGetDetailId(detail, idProperty) is int id)
                    ids.Add(id);
            }
            return ids;
        }

        private static string EnrichDetailsImages(string? orderDetailsJson, string idProperty, string imageProperty, IReadOnlyDictionary<int, string> imagesById)
        {
            if (string.IsNullOrWhiteSpace(orderDetailsJson)) return orderDetailsJson ?? string.Empty;
            JsonNode? root;
            try
            {
                root = JsonNode.Parse(orderDetailsJson);
            }
            catch
            {
                return orderDetailsJson;
            }
            if (root is not JsonArray details) return orderDetailsJson;
            foreach (var node in details)
            {
                if (node is not JsonObject detail) continue;
                if (TryGetDetailId(detail, idProperty) is not int id) continue;
                if (imagesById.TryGetValue(id, out var images) && !string.IsNullOrWhiteSpace(images))
                    detail[imageProperty] = images;
            }
            return root.ToJsonString();
        }

        private static int? TryGetDetailId(JsonObject detail, string pascalName)
        {
            var camelName = char.ToLowerInvariant(pascalName[0]) + pascalName[1..];
            foreach (var name in new[] { pascalName, camelName })
            {
                if (detail.TryGetPropertyValue(name, out var node) && node != null &&
                    int.TryParse(node.ToJsonString(), out var id))
                    return id;
            }
            return null;
        }

        /// <summary>
        /// Rút phương thức thanh toán ("cod"/"qr") từ DeliveryInformation mà FE gửi
        /// kèm lúc đặt hàng. JSON lỗi hoặc không có key thì trả chuỗi rỗng.
        /// </summary>
        private static string ExtractPaymentMethod(string? deliveryInformation)
        {
            if (string.IsNullOrWhiteSpace(deliveryInformation)) return string.Empty;
            try
            {
                using var deliveryDoc = JsonDocument.Parse(deliveryInformation);
                if (deliveryDoc.RootElement.TryGetProperty("paymentMethod", out var methodElement))
                {
                    return methodElement.GetString()?.ToLowerInvariant() ?? string.Empty;
                }
            }
            catch
            {
                // DeliveryInformation không phải JSON hợp lệ.
            }
            return string.Empty;
        }

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

                // Gắn ảnh cây vào từng chi tiết để FE lịch sử hiện đúng ảnh cây đã mua.
                var teaIds = orderTeas.SelectMany(ot => CollectDetailIds(ot.OrderDetails, "TeaId")).Distinct().ToList();
                var teasById = teaIds.Count > 0
                    ? _teaRepository.GetListAsync(t => teaIds.Contains(t.Id)).ToDictionary(t => t.Id, t => t.Images ?? string.Empty)
                    : new Dictionary<int, string>();

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
                            ReasonCancellation = order.ReasonCancellation ?? string.Empty,
                            TotalPrice = order.TotalPrice,
                            PrePayment = order.PrePayment,
                            TotalPayment = order.TotalPayment,
                            DeliveryInformation = order.DeliveryInformation,
                            OrderDetails = EnrichDetailsImages(orderTea.OrderDetails, "TeaId", "TeaImages", teasById),
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

                // Gắn ảnh sản phẩm vào từng chi tiết để FE lịch sử hiện đúng ảnh sản phẩm đã mua.
                var productIds = orderProducts.SelectMany(op => CollectDetailIds(op.OrderDetails, "ProductId")).Distinct().ToList();
                var productsById = productIds.Count > 0
                    ? _productRepository.GetListAsync(p => productIds.Contains(p.Id)).ToDictionary(p => p.Id, p => p.Images ?? string.Empty)
                    : new Dictionary<int, string>();

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
                            TotalPayment = order.TotalPayment,
                            OrderType = order.Type.ToString(),
                            DeliveryInformation = order.DeliveryInformation,
                            Status = orderProduct.Status,
                            ReasonCancellation = order.ReasonCancellation ?? string.Empty,
                            OrderDetails = EnrichDetailsImages(orderProduct.OrderDetails, "ProductId", "ProductImages", productsById),
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