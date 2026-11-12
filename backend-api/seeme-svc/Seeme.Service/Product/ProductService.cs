using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Seeme.Data.Repositories;
using Seeme.Domain.Constant;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.Product;
using Seeme.Service.ProductService;
using System.Linq.Dynamic.Core;
using System.Text.Json;

namespace Seeme.Service.ProductService
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly IOrderProductRepository _orderProductRepository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(IProductRepository productRepository, IOrderProductRepository orderProductRepository, ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _orderProductRepository = orderProductRepository;
            _logger = logger;
        }

        /// <summary>
        /// Thêm mới sản phẩm
        /// </summary>
        public async Task<Response<Product>> AddProductAsync(Product product)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(product.Name))
                {
                    return new Response<Product>(400, "Tên sản phẩm không được để trống");
                }

                var result = await _productRepository.CreateAsync(product);
                return new Response<Product>(result);
            }
            catch (Exception ex)
            {
                return new Response<Product>(500, $"Lỗi khi thêm sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin sản phẩm
        /// </summary>
        public async Task<Response<Product>> UpdateProductAsync(int id, Product product)
        {
            try
            {
                var existingProduct = await _productRepository.GetByIdAsync(id);
                if (existingProduct == null)
                {
                    return new Response<Product>(404, "Sản phẩm không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(product.Name))
                {
                    return new Response<Product>(400, "Tên sản phẩm không được để trống");
                }

                existingProduct.Name = product.Name;
                existingProduct.GroupId = product.GroupId;
                existingProduct.Price = product.Price;
                existingProduct.Total = product.Total;
                existingProduct.Description = product.Description;
                existingProduct.UserManual = product.UserManual;
                existingProduct.StorageInstructions = product.StorageInstructions;
                existingProduct.Images = product.Images;
                existingProduct.Quantity = product.Quantity;
                existingProduct.PackagingName = product.PackagingName;
                existingProduct.VariantName = product.VariantName;
                existingProduct.IsGiftSet = product.IsGiftSet;
                existingProduct.CollectionName = product.CollectionName;
                existingProduct.ColorOptions = product.ColorOptions;
                existingProduct.IsActive = product.IsActive;

                var result = await _productRepository.UpdateAsync(existingProduct);
                return new Response<Product>(result);
            }
            catch (Exception ex)
            {
                return new Response<Product>(500, $"Lỗi khi cập nhật sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa sản phẩm
        /// </summary>
        public async Task<Response<bool>> DeleteProductAsync(int id)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);
                if (product == null)
                {
                    return new Response<bool>(404, "Sản phẩm không tồn tại");
                }

                var result = await _productRepository.DeleteByIdAsync(id);
                return new Response<bool>(result);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết sản phẩm theo ID
        /// </summary>
        public async Task<Response<Product>> GetProductByIdAsync(int id)
        {
            try
            {
                var product = await _productRepository.GetByIdAsync(id);
                if (product == null)
                {
                    return new Response<Product>(404, "Sản phẩm không tồn tại");
                }

                return new Response<Product>(product);
            }
            catch (Exception ex)
            {
                return new Response<Product>(500, $"Lỗi khi lấy thông tin sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết sản phẩm theo danh mục ID
        /// </summary>
        public async Task<Response<List<Product>>> GetProductByCategoryIdAsync(int id)
        {
            try
            {
                var products = await _productRepository.GetListAsync(x => x.CategoryId == id).ToListAsync();
                if (products == null || !products.Any())
                {
                    return new Response<List<Product>>(404, "Không tìm thấy sản phẩm thuộc danh mục này");
                }

                return new Response<List<Product>>(products);
            }
            catch (Exception ex)
            {
                return new Response<List<Product>>(500, $"Lỗi khi lấy danh sách sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách sản phẩm phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<Product>>> GetProductsPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                var result = await _productRepository.GetPagingAsync<Product>(paginationParam);
                return new Response<PagingDataModel<Product>>(result);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<Product>>(500, $"Lỗi khi lấy danh sách sản phẩm: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy số lượng đã bán theo từng sản phẩm (kể cả set quà tặng).
        /// "Đã bán" = tổng Quantity trong OrderDetails của các dòng đơn hàng sản phẩm
        /// có Status = Completed (Hoàn thành). Đơn chờ xác nhận / đang chuẩn bị / đã giao
        /// chưa tính, đơn đã hủy (Canceled) không bao giờ tính.
        /// </summary>
        public async Task<Response<List<SoldCountModel>>> GetSoldCountsAsync()
        {
            try
            {
                // GetListAsync đã lọc IsDelete; chỉ lấy dòng đơn đã hoàn thành.
                var completedRows = await _orderProductRepository
                    .GetListAsync(op => op.Status == Enumerations.OrderProductStatus.Completed)
                    .ToListAsync();

                var counts = new Dictionary<int, int>();
                foreach (var row in completedRows)
                {
                    if (string.IsNullOrWhiteSpace(row.OrderDetails))
                    {
                        continue;
                    }

                    JsonDocument doc;
                    try
                    {
                        doc = JsonDocument.Parse(row.OrderDetails);
                    }
                    catch
                    {
                        continue;
                    }

                    using (doc)
                    {
                        var details = new List<JsonElement>();
                        if (doc.RootElement.ValueKind == JsonValueKind.Array)
                        {
                            details.AddRange(doc.RootElement.EnumerateArray());
                        }
                        else if (doc.RootElement.ValueKind == JsonValueKind.Object)
                        {
                            details.Add(doc.RootElement);
                        }

                        foreach (var detail in details)
                        {
                            // OrderDetails của 1 đơn có thể chứa cả dòng cây trà (đơn Both),
                            // chỉ cộng dòng Type = product.
                            if (!TryGetPropertyIgnoreCase(detail, "Type", out var type)
                                || !string.Equals(type.GetString(), "product", StringComparison.OrdinalIgnoreCase))
                            {
                                continue;
                            }

                            if (!TryGetPropertyIgnoreCase(detail, "ProductId", out var productIdElement)
                                || productIdElement.ValueKind != JsonValueKind.Number
                                || !productIdElement.TryGetInt32(out var productId))
                            {
                                continue;
                            }

                            if (!TryGetPropertyIgnoreCase(detail, "Quantity", out var quantityElement)
                                || quantityElement.ValueKind != JsonValueKind.Number
                                || !quantityElement.TryGetInt32(out var quantity)
                                || quantity <= 0)
                            {
                                continue;
                            }

                            counts[productId] = counts.TryGetValue(productId, out var current)
                                ? current + quantity
                                : quantity;
                        }
                    }
                }

                var result = counts
                    .Select(kv => new SoldCountModel { ProductId = kv.Key, SoldCount = kv.Value })
                    .OrderByDescending(x => x.SoldCount)
                    .ToList();
                return new Response<List<SoldCountModel>>(result);
            }
            catch (Exception ex)
            {
                return new Response<List<SoldCountModel>>(500, $"Lỗi khi lấy số lượng đã bán: {ex.Message}");
            }
        }

        private static bool TryGetPropertyIgnoreCase(JsonElement element, string name, out JsonElement value)
        {
            if (element.ValueKind != JsonValueKind.Object)
            {
                value = default;
                return false;
            }

            if (element.TryGetProperty(name, out value))
            {
                return true;
            }

            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }

            value = default;
            return false;
        }
    }
}