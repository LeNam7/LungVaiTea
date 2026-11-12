using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Service.ProductService;

namespace Seeme.API.Controllers
{
    /// <summary>
    /// API quản lý sản phẩm trà
    /// </summary>
    [ApiController]
    [Route("api/product")]
    public class ProductController : ControllerBase
    {
        private readonly ILogger<ProductController> _logger;
        private readonly IProductService _productService;

        /// <summary>
        /// Contuctor khởi tạo ProductController với logger và productService được inject từ DI container
        /// </summary>
        /// <param name="logger"></param>
        /// <param name="productService"></param>
        public ProductController(ILogger<ProductController> logger, IProductService productService)
        {
            _logger = logger;
            _productService = productService;
        }

        #region Product Endpoints

        /// <summary>
        /// Lấy danh sách sản phẩm phân trang (20 bản ghi/trang)
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns>Danh sách sản phẩm phân trang</returns>
        [HttpPost("paging")]
        public async Task<ActionResult> GetProductsPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _productService.GetProductsPagingAsync(param);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết sản phẩm theo ID
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns>Thông tin sản phẩm</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetProductById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID sản phẩm không hợp lệ"
                    );
                }

                var res = await _productService.GetProductByIdAsync(id);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Lấy danh sách sản phẩm theo ID danh mục
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns>Thông tin sản phẩm</returns>
        [HttpGet("category/{id}")]
        public async Task<ActionResult> GetProductsCategoryById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID sản phẩm không hợp lệ"
                    );
                }

                var res = await _productService.GetProductByCategoryIdAsync(id);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Thêm mới sản phẩm
        /// </summary>
        /// <param name="garden">Thông tin sản phẩm cần thêm</param>
        /// <returns>Vườn trà vừa tạo</returns>
        [HttpPost]
        public async Task<ActionResult> AddProduct([FromBody] Product garden)
        {
            try
            {
                if (garden == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin sản phẩm không được để trống"
                    );
                }

                var res = await _productService.AddProductAsync(garden);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return StatusCode(StatusCodes.Status201Created, res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Cập nhật thông tin sản phẩm
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <param name="garden">Thông tin sản phẩm cần cập nhật</param>
        /// <returns>Vườn trà sau khi cập nhật</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateProduct(int id, [FromBody] Product garden)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID sản phẩm không hợp lệ"
                    );
                }

                if (garden == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin sản phẩm không được để trống"
                    );
                }

                var res = await _productService.UpdateProductAsync(id, garden);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        /// <summary>
        /// Xóa sản phẩm
        /// </summary>
        /// <param name="id">ID của sản phẩm</param>
        /// <returns>Kết quả xóa</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID sản phẩm không hợp lệ"
                    );
                }

                var res = await _productService.DeleteProductAsync(id);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }
        /// <summary>
        /// Lấy số lượng đã bán theo từng sản phẩm (kể cả set quà tặng),
        /// để hiển thị cột "Đã bán" và sắp xếp "Bán chạy nhất".
        /// Chỉ tính dòng đơn đã hoàn thành (Status = Completed), loại đơn hủy.
        /// </summary>
        /// <returns>Danh sách {productId, soldCount} xếp theo số đã bán giảm dần</returns>
        [HttpGet("sold-counts")]
        public async Task<ActionResult> GetSoldCounts()
        {
            try
            {
                var res = await _productService.GetSoldCountsAsync();
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return Ok(res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    $"Xảy ra lỗi trong quá trình xử lý: {ex.Message}"
                );
            }
        }

        #endregion
    }
}