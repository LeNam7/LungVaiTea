using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Models.Tracking;
using Seeme.Service.Tracking;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/tracking")]
    [Authorize]
    public class TrackingController : ControllerBase
    {
        private readonly ITrackingService _trackingService;

        public TrackingController(ITrackingService trackingService)
        {
            _trackingService = trackingService;
        }


        /// <summary>
        /// Lấy thông tin tracking theo Type, Action, ItemId
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost("get")]
        public async Task<ActionResult> GetTrackingByIdAsync(TrackingGetModel model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var res = await _trackingService.GetTrackingByIdAsync(currentUserId ?? 0, model);
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
        /// Lấy danh sách tracking của người dùng theo Action (Like = 1, View = 2)
        /// </summary>
        /// <param name="action"></param>
        /// <returns></returns>
        [HttpGet("get-by-action")]
        public async Task<ActionResult> GetTrackingByActionAsync([FromQuery] TrackingAction action)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var res = await _trackingService.GetTrackingByUserIdAsync(currentUserId ?? 0, action);
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
        /// Thêm mới tracking
        /// </summary>
        /// <param name="model">Dữ liệu tracking</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] TrackingCreatedModel model)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var res = await _trackingService.AddTrackingAsync(currentUserId ?? 0, model);
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
        /// Xóa tracking (soft delete)
        /// </summary>
        /// <param name="id">Id của tracking</param>
        /// <returns></returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            try
            {
                var res = await _trackingService.DeleteTrackingAsync(id);
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
