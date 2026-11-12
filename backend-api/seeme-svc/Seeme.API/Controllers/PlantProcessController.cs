using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Seeme.Domain.Models;
using Seeme.Domain.Models.PlantProgressModel;
using Seeme.Service.PlantProcess;

namespace Seeme.API.Controllers;

[ApiController]
[Route("api/plant-process")]
[Authorize]
public class PlantProcessController : ControllerBase
{
    private readonly IPlantProcessService _plantProcessService;

    public PlantProcessController(IPlantProcessService plantProcessService)
    {
        _plantProcessService = plantProcessService;
    }

    /// <summary>
    /// Thêm mới tiến độ cây trồng
    /// </summary>
    /// <param name="request">Thông tin tiến độ cây trồng cần thêm</param>
    /// <returns>Thông tin tiến độ cây trồng vừa tạo</returns>
    [HttpPost]
    public async Task<ActionResult<PlantProgressResponse>> Add([FromBody] CreatePlantProgressRequest request)
    {
        try
        {
            var result = await _plantProcessService.AddAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật thông tin tiến độ cây trồng
    /// </summary>
    /// <param name="request">Thông tin tiến độ cây trồng cần cập nhật</param>
    /// <returns>Thông tin tiến độ cây trồng sau khi cập nhật</returns>
    [HttpPut]
    public async Task<ActionResult<PlantProgressResponse>> Update([FromBody] UpdatePlantProgressRequest request)
    {
        try
        {
            var result = await _plantProcessService.UpdateAsync(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy danh sách tiến độ cây trồng phân trang theo TeaId và OwnerId
    /// </summary>
    /// <param name="teaId">ID của cây trồng</param>
    /// <param name="ownerId">ID của chủ sở hữu</param>
    /// <param name="pageIndex">Số trang (mặc định: 1)</param>
    /// <param name="pageSize">Kích thước trang (mặc định: 20)</param>
    /// <param name="orderBy">Sắp xếp (mặc định: CreatedDate desc)</param>
    /// <param name="keyword">Từ khóa tìm kiếm</param>
    /// <returns>Danh sách tiến độ cây trồng phân trang</returns>
    [HttpGet("paging")]
    public async Task<ActionResult<PagingDataModel<PlantProgressResponse>>> GetPaging(
        [FromQuery] int teaId,
        [FromQuery] int ownerId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? orderBy = null,
        [FromQuery] string? keyword = null)
    {
        try
        {
            var paginationParam = new PaginationParam
            {
                PageIndex = pageIndex,
                PageSize = pageSize,
                OrderBy = orderBy,
                Keyword = keyword
            };

            var result = await _plantProcessService.GetPagingAsync(paginationParam, teaId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lấy tất cả tiến độ cây trồng theo TeaId và OwnerId
    /// </summary>
    /// <param name="teaId">ID của cây trồng</param>
    /// <returns>Danh sách tất cả tiến độ cây trồng</returns>
    [HttpGet]
    public async Task<ActionResult<List<PlantProgressResponse>>> GetByTeaIdAndOwnerId(
        [FromQuery] int teaId)
    {
        try
        {
            var result = await _plantProcessService.GetByTeaIdAndOwnerIdAsync(teaId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}