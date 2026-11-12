using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Service.UserAddressService;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/user-address")]
    public class UserAddressController : ControllerBase
    {
        private readonly IUserAddressService _userAddressService;

        public UserAddressController(IUserAddressService userAddressService)
        {
            _userAddressService = userAddressService;
        }

        /// <summary>
        /// Thêm địa chỉ mới cho người dùng hiện tại
        /// </summary>
        [HttpPost]
        public async Task<ActionResult> Add([FromBody] UserAddress model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _userAddressService.AddUserAddressAsync(currentUserId.Value, model);
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
        /// Cập nhật địa chỉ theo Id
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] UserAddress model)
        {
            try
            {
                var res = await _userAddressService.UpdateUserAddressAsync(id, model);
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
        /// Xóa (soft) địa chỉ theo Id
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var res = await _userAddressService.DeleteUserAddressAsync(id);
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
        /// Lấy tất cả địa chỉ của người dùng hiện tại
        /// </summary>
        [HttpGet]
        public async Task<ActionResult> GetAllForCurrentUser()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _userAddressService.GetUserAddressesAsync(currentUserId.Value);
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
        /// Lấy địa chỉ theo Id
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetById(int id)
        {
            try
            {
                var res = await _userAddressService.GetUserAddressByIdAsync(id);
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
        /// Lấy địa chỉ mặc định của người dùng hiện tại
        /// </summary>
        [HttpGet("default")]
        public async Task<ActionResult> GetDefault()
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _userAddressService.GetDefaultUserAddressAsync(currentUserId.Value);
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
        /// Đặt một địa chỉ làm mặc định (cho người dùng hiện tại)
        /// </summary>
        [HttpPut("set-default/{id}")]
        public async Task<ActionResult> SetDefault(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _userAddressService.SetDefaultAddressAsync(id, currentUserId.Value);
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
        /// Lấy danh sách địa chỉ phân trang cho người dùng hiện tại
        /// </summary>
        [HttpPost("paging")]
        public async Task<ActionResult> GetPaging([FromBody] PaginationParam param)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (currentUserId == null)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng");
                }

                var res = await _userAddressService.GetUserAddressesPagingAsync(currentUserId.Value, param);
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