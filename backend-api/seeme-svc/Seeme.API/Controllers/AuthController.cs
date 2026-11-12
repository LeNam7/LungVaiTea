using Seeme.Domain.Models.Auth;
using Seeme.Domain.Models.User;
using Seeme.Service.Auth;
using Seeme.Service.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Seeme.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;

    public AuthController(IAuthService authService, IUserService userService)
    {
        _authService = authService;
        _userService = userService;
    }

    /// <summary>
    /// Đăng nhập hệ thống
    /// </summary>
    /// <ParamPaging name="loginModel"></ParamPaging>
    /// <returns></returns>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login(LoginModel loginModel)
    {
        try
        {
            var res = await _authService.HandleLogin(loginModel);
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
    /// Làm mới token
    /// </summary>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPost("refresh-token")]
    public async Task<ActionResult> RefreshToken(RefreshTokenModel model)
    {
        try
        {
            var res = await _authService.RefreshToken(model);
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
    /// Tạo mới người dùng
    /// </summary>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Create([FromBody] CreateUserModel model)
    {
        try
        {
            var res = await _authService.CreateUserAsync(model);
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
    /// Thay đổi mật khẩu người dùng
    /// </summary>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPut("change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordInputModel model)
    {
        try
        {
            var res = await _authService.ChangePasswordAsync(model);
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
    /// Gửi mã OTP quên mật khẩu tới email
    /// </summary>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequestModel model)
    {
        try
        {
            var res = await _authService.ForgotPasswordAsync(model);
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
    /// Đặt lại mật khẩu bằng OTP
    /// </summary>
    /// <ParamPaging name="model"></ParamPaging>
    /// <returns></returns>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordWithOtpModel model)
    {
        try
        {
            var res = await _authService.ResetPasswordWithOtpAsync(model);
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
    /// Lấy thông tin người dùng theo Id
    /// </summary>
    /// <ParamPaging name="userId"></ParamPaging>
    /// <returns></returns>
    [HttpGet("{userId}")]
    public async Task<ActionResult> GetUserInfo(int userId)
    {
        try
        {
            var res = await _userService.GetUserByIdAsync(userId);
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
}
