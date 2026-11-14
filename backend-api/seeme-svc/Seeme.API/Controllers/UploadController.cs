using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Seeme.Service.Upload;
using Seeme.Domain.Models.ReponseModel;
using System.Threading.Tasks;

namespace Seeme.API.Controllers
{
    [ApiController]
    [Route("api/upload")]
    [Authorize(Roles = "Admin")]
    public class UploadController : ControllerBase
    {
        private readonly IUploadService _uploadService;

        public UploadController(IUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        /// <summary>
        /// Upload an image file and get the image URL.
        /// </summary>
        /// <param name="file">The image file to upload.</param>
        /// <returns>Response with the image URL.</returns>
        [HttpPost("image")]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
        {
            var response = await _uploadService.UploadImageAsync(file);
            if (response.StatusCode != 200)
                return StatusCode(response.StatusCode, response.Message);

            return Ok(response);
        }

        /// <summary>
        /// Upload a YouTube link and validate it.
        /// </summary>
        /// <param name="youtubeUrl">The YouTube link to upload.</param>
        /// <returns>Response with the validated YouTube link.</returns>
        [HttpPost("youtube")]
        public async Task<IActionResult> UploadYoutubeLink([FromBody] string youtubeUrl)
        {
            var response = await _uploadService.UploadYoutubeLinkAsync(youtubeUrl);
            if (response.StatusCode != 200)
                return StatusCode(response.StatusCode, response.Message);

            return Ok(response);
        }
    }
}
