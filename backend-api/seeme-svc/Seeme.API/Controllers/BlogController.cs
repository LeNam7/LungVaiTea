using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Blog;
using Seeme.Service.BlogService;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/blog")]
    [Authorize]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _blogService;

        public BlogController(IBlogService blogService)
        {
            _blogService = blogService;
        }

        /// <summary>
        /// Lấy danh sách bài viết phân trang
        /// </summary>
        /// <param name="param">Tham số phân trang</param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("paging")]
        public async Task<ActionResult> GetPaging([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _blogService.GetPaging(param);
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
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Lấy thông tin bài viết theo Id
        /// </summary>
        /// <param name="id">Id của bài viết</param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            try
            {
                var res = await _blogService.GetByIdAsync(id);
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
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Thêm mới bài viết
        /// </summary>
        /// <param name="model">Dữ liệu bài viết</param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateBlogInput model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(
                        StatusCodes.Status401Unauthorized,
                        "Không thể xác định người dùng"
                    );
                }

                var res = await _blogService.CreateAsync(model, currentUserId.Value);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return CreatedAtAction(nameof(GetById), new { id = res.Data }, res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Cập nhật bài viết
        /// </summary>
        /// <param name="id">Id của bài viết</param>
        /// <param name="model">Dữ liệu cập nhật</param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UpdateBlogInput model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(
                        StatusCodes.Status401Unauthorized,
                        "Không thể xác định người dùng"
                    );
                }

                var res = await _blogService.UpdateAsync(id, model, currentUserId.Value);
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
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Xóa bài viết (soft delete)
        /// </summary>
        /// <param name="id">Id của bài viết</param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(
                        StatusCodes.Status401Unauthorized,
                        "Không thể xác định người dùng"
                    );
                }

                var res = await _blogService.DeleteAsync(id, currentUserId.Value);
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
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Gửi liên hệ (contact) từ người dùng đến hệ thống.
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("send-contact")]
        public async Task<ActionResult> SendContact([FromBody] Contact model)
        {
            try
            {
                var res = await _blogService.SendContactAsync(model);
                if (res.StatusCode != StatusCodes.Status200OK)
                {
                    return StatusCode(res.StatusCode, res.Message);
                }
                return CreatedAtAction(nameof(GetById), new { id = res.Data }, res);
            }
            catch (Exception ex)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        /// <summary>
        /// Phân trang danh sách liên hệ (contact) của người dùng
        /// </summary>
        /// <param name="param"></param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpPost("paging-contact")]
        public async Task<ActionResult> GetPagingContact([FromBody] PaginationParam param)
        {
            try
            {
                var res = await _blogService.GetContactsPaging(param);
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
                    "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
                );
            }
        }

        private int? GetCurrentUserId()
        {
            // JWT token stores user ID in "sub" claim (JwtRegisteredClaimNames.Sub)
            var userIdClaim =
                User.FindFirst("sub")
                ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}
