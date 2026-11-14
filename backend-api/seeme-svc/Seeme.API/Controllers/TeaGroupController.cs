using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Service.Tree;

namespace Seeme.API.Controllers
{
    /// <summary>
    /// API quản lý nhóm trà (cấp cao hơn danh mục, khớp CategoryTea.Group theo slug)
    /// </summary>
    [ApiController]
    [Route("api/tea-groups")]
    [Authorize]
    public class TeaGroupController : ControllerBase
    {
        private readonly ILogger<TeaGroupController> _logger;
        private readonly ITeaService _teaService;

        public TeaGroupController(ILogger<TeaGroupController> logger, ITeaService teaService)
        {
            _logger = logger;
            _teaService = teaService;
        }

        /// <summary>
        /// Lấy danh sách nhóm trà phân trang (20 bản ghi/trang)
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns>Danh sách nhóm trà phân trang</returns>
        [AllowAnonymous]
        [HttpPost("paging")]
        public async Task<ActionResult> GetTeaGroupsPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _teaService.GetTeaGroupsPagingAsync(param);
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
        /// Lấy thông tin chi tiết nhóm trà theo slug
        /// </summary>
        /// <param name="slug">Slug của nhóm trà (vd: luc-tra)</param>
        /// <returns>Thông tin nhóm trà</returns>
        [AllowAnonymous]
        [HttpGet("{slug}")]
        public async Task<ActionResult> GetTeaGroupBySlug(string slug)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slug))
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Slug nhóm trà không hợp lệ"
                    );
                }

                var res = await _teaService.GetTeaGroupBySlugAsync(slug);
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
        /// Thêm mới nhóm trà
        /// </summary>
        /// <param name="group">Thông tin nhóm trà cần thêm</param>
        /// <returns>Nhóm trà vừa tạo</returns>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult> AddTeaGroup([FromBody] TeaGroup group)
        {
            try
            {
                if (group == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin nhóm trà không được để trống"
                    );
                }

                var res = await _teaService.AddTeaGroupAsync(group);
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
        /// Cập nhật thông tin nhóm trà (không đổi được slug)
        /// </summary>
        /// <param name="slug">Slug của nhóm trà</param>
        /// <param name="group">Thông tin nhóm trà cần cập nhật</param>
        /// <returns>Nhóm trà sau khi cập nhật</returns>
        [Authorize(Roles = "Admin")]
        [HttpPut("{slug}")]
        public async Task<ActionResult> UpdateTeaGroup(string slug, [FromBody] TeaGroup group)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slug))
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Slug nhóm trà không hợp lệ"
                    );
                }

                if (group == null)
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Thông tin nhóm trà không được để trống"
                    );
                }

                var res = await _teaService.UpdateTeaGroupAsync(slug, group);
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
        /// Xóa nhóm trà (xóa mềm; chặn xóa khi còn danh mục thuộc nhóm)
        /// </summary>
        /// <param name="slug">Slug của nhóm trà</param>
        /// <returns>Kết quả xóa</returns>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{slug}")]
        public async Task<ActionResult> DeleteTeaGroup(string slug)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(slug))
                {
                    return StatusCode(
                        StatusCodes.Status400BadRequest,
                        "Slug nhóm trà không hợp lệ"
                    );
                }

                var res = await _teaService.DeleteTeaGroupAsync(slug);
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
    }
}
