using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Service.Tree;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/")]
    public class CommonController : ControllerBase
    {
        private readonly ILogger<CommonController> _logger;
        private readonly ITeaService _teaService;

        public CommonController(ILogger<CommonController> logger, ITeaService teaService)
        {
            _logger = logger;
            _teaService = teaService;
        }

        #region Garden Endpoints

        /// <summary>
        /// Lấy danh sách vườn trà phân trang (20 bản ghi/trang)
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns>Danh sách vườn trà phân trang</returns>
        [HttpPost("gardens/paging")]
        public async Task<ActionResult> GetGardensPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _teaService.GetGardensPagingAsync(param);
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
        /// Lấy thông tin chi tiết vườn trà theo ID
        /// </summary>
        /// <param name="id">ID của vườn trà</param>
        /// <returns>Thông tin vườn trà</returns>
        [HttpGet("gardens/{id}")]
        public async Task<ActionResult> GetGardenById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID vườn không hợp lệ"
                    );
                }

                var res = await _teaService.GetGardenByIdAsync(id);
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
        /// Thêm mới vườn trà
        /// </summary>
        /// <param name="garden">Thông tin vườn trà cần thêm</param>
        /// <returns>Vườn trà vừa tạo</returns>
        [HttpPost("gardens")]
        public async Task<ActionResult> AddGarden([FromBody] Garden garden)
        {
            try
            {
                if (garden == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin vườn không được để trống"
                    );
                }

                var res = await _teaService.AddGardenAsync(garden);
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
        /// Cập nhật thông tin vườn trà
        /// </summary>
        /// <param name="id">ID của vườn trà</param>
        /// <param name="garden">Thông tin vườn trà cần cập nhật</param>
        /// <returns>Vườn trà sau khi cập nhật</returns>
        [HttpPut("gardens/{id}")]
        public async Task<ActionResult> UpdateGarden(int id, [FromBody] Garden garden)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID vườn không hợp lệ"
                    );
                }

                if (garden == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin vườn không được để trống"
                    );
                }

                var res = await _teaService.UpdateGardenAsync(id, garden);
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
        /// Xóa vườn trà
        /// </summary>
        /// <param name="id">ID của vườn trà</param>
        /// <returns>Kết quả xóa</returns>
        [HttpDelete("gardens/{id}")]
        public async Task<ActionResult> DeleteGarden(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID vườn không hợp lệ"
                    );
                }

                var res = await _teaService.DeleteGardenAsync(id);
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

        #region CategoryTea Endpoints

        /// <summary>
        /// Lấy danh sách phân loại cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns>Danh sách phân loại cây trà phân trang</returns>
        [HttpPost("categories/paging")]
        public async Task<ActionResult> GetCategoriesPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _teaService.GetCategoryTeasPagingAsync(param);
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
        /// Lấy thông tin chi tiết phân loại cây trà theo ID
        /// </summary>
        /// <param name="id">ID của phân loại cây trà</param>
        /// <returns>Thông tin phân loại cây trà</returns>
        [HttpGet("categories/{id}")]
        public async Task<ActionResult> GetCategoryTeaById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID phân loại không hợp lệ"
                    );
                }

                var res = await _teaService.GetCategoryTeaByIdAsync(id);
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
        /// Thêm mới phân loại cây trà
        /// </summary>
        /// <param name="category">Thông tin phân loại cây trà cần thêm</param>
        /// <returns>Phân loại cây trà vừa tạo</returns>
        [HttpPost("categories")]
        public async Task<ActionResult> AddCategoryTea([FromBody] CategoryTea category)
        {
            try
            {
                if (category == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin phân loại không được để trống"
                    );
                }

                var res = await _teaService.AddCategoryTeaAsync(category);
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
        /// Cập nhật thông tin phân loại cây trà
        /// </summary>
        /// <param name="id">ID của phân loại cây trà</param>
        /// <param name="category">Thông tin phân loại cây trà cần cập nhật</param>
        /// <returns>Phân loại cây trà sau khi cập nhật</returns>
        [HttpPut("categories/{id}")]
        public async Task<ActionResult> UpdateCategoryTea(int id, [FromBody] CategoryTea category)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID phân loại không hợp lệ"
                    );
                }

                if (category == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin phân loại không được để trống"
                    );
                }

                var res = await _teaService.UpdateCategoryTeaAsync(id, category);
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
        /// Xóa phân loại cây trà
        /// </summary>
        /// <param name="id">ID của phân loại cây trà</param>
        /// <returns>Kết quả xóa</returns>
        [HttpDelete("categories/{id}")]
        public async Task<ActionResult> DeleteCategoryTea(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID phân loại không hợp lệ"
                    );
                }

                var res = await _teaService.DeleteCategoryTeaAsync(id);
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

        #region Tea Endpoints

        /// <summary>
        /// Lấy danh sách cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns>Danh sách cây trà phân trang</returns>
        [HttpPost("teas/paging")]
        public async Task<ActionResult> GetTeasPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _teaService.GetTeasPagingAsync(param);
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
        /// Lấy thông tin chi tiết cây trà theo ID
        /// </summary>
        /// <param name="id">ID của cây trà</param>
        /// <returns>Thông tin cây trà</returns>
        [HttpGet("teas/{id}")]
        public async Task<ActionResult> GetTeaById(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID cây trà không hợp lệ"
                    );
                }

                var res = await _teaService.GetTeaByIdAsync(id);
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

        [HttpGet("teas/owner")]
        public async Task<ActionResult> GetTeaByUserId()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(
                        StatusCodes.Status401Unauthorized,
                        "Người dùng chưa đăng nhập hoặc không có quyền truy cập"
                    );
                }

                var res = await _teaService.GetTeaByUserIdAsync(currentUserId.Value);
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
        /// Thêm mới cây trà
        /// </summary>
        /// <param name="tea">Thông tin cây trà cần thêm</param>
        /// <returns>Cây trà vừa tạo</returns>
        [HttpPost("teas")]
        public async Task<ActionResult> AddTea([FromBody] Tea tea)
        {
            try
            {
                if (tea == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin cây trà không được để trống"
                    );
                }

                var res = await _teaService.AddTeaAsync(tea);
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
        /// Cập nhật thông tin cây trà
        /// </summary>
        /// <param name="id">ID của cây trà</param>
        /// <param name="tea">Thông tin cây trà cần cập nhật</param>
        /// <returns>Cây trà sau khi cập nhật</returns>
        [HttpPut("teas/{id}")]
        public async Task<ActionResult> UpdateTea(int id, [FromBody] Tea tea)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID cây trà không hợp lệ"
                    );
                }

                if (tea == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin cây trà không được để trống"
                    );
                }

                var res = await _teaService.UpdateTeaAsync(id, tea);
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
        /// Xóa cây trà
        /// </summary>
        /// <param name="id">ID của cây trà</param>
        /// <returns>Kết quả xóa</returns>
        [HttpDelete("teas/{id}")]
        public async Task<ActionResult> DeleteTea(int id)
        {
            try
            {
                if (id <= 0)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "ID cây trà không hợp lệ"
                    );
                }

                var res = await _teaService.DeleteTeaAsync(id);
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