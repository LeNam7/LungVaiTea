using Microsoft.AspNetCore.Authorization;
using Seeme.Domain.Constant;
using Seeme.Domain.Models;
using Seeme.Domain.Models.User;
using Seeme.Service.User;
using Microsoft.AspNetCore.Mvc;

namespace Seeme.API.Controllers;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }
    
    /// <summary>
    /// Lấy danh sách người dùng phân trang
    /// </summary>
    /// <ParamPaging name="param"></ParamPaging>
    /// <returns></returns>
    [Authorize(Roles = "Admin")]
    [HttpPost("paging")]
    public async Task<ActionResult> GetPaging([FromBody] PaginationParam param)
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

            var res = await _userService.GetPaging(param, currentUserId.Value);
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
                "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
            );
        }
    }
    
    /// <summary>
    /// Thêm mới người dùng bởi Admin
    /// </summary>
    /// <ParamPaging name="param"></ParamPaging>
    /// <returns></returns>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult> AddNewUserByAdmin([FromBody] CreateUserByAdminInput param)
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
            
            var res = await _userService.AddNewUserByAdmin((int)currentUserId, param);
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
                "Xảy ra lỗi trong quá trình xử lý: \n" + ex.Message + ex.StackTrace
            );
        }
    }

    /// <summary>
    /// Lấy thông tin người dùng theo Id
    /// </summary>
    /// <ParamPaging name="id"></ParamPaging>
    /// <returns></returns>
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        try
        {
            var res = await _userService.GetUserByIdAsync(id);
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
    /// Cập nhật thông tin người dùng
    /// </summary>
    /// <ParamPaging name="id"></ParamPaging>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] UpdateUserModel model)
    {
        try
        {
            var res = await _userService.UpdateUserAsync(id, model);
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
    /// Xóa người dùng (soft delete)
    /// </summary>
    /// <ParamPaging name="id"></ParamPaging>
    /// <returns></returns>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        try
        {
            var res = await _userService.DeleteUser(id);
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
    /// Cập nhật khóa/mở khóa tài khoản người dùng
    /// </summary>
    /// <ParamPaging name="id"></ParamPaging>
    /// <ParamPaging name="param"></ParamPaging>
    /// <returns></returns>
    [Authorize(Roles = "Admin")]
    [HttpPut("block/{id}")]
    public async Task<ActionResult> UpdateRole(int id)
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
            
            var res = await _userService.BlockUserAsync(id, currentUserId ?? 0);
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
