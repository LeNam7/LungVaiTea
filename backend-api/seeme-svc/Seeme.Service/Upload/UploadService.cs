using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Seeme.Domain.Models.ReponseModel;
using System.IO;

namespace Seeme.Service.Upload
{
    public class UploadService : IUploadService
    {
        // Upload image and return image URL
        public async Task<Response<string>> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return new Response<string>(400, "File ảnh không hợp lệ");

            // Đường dẫn thư mục lưu ảnh (ví dụ: wwwroot/uploads)
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Giả sử URL public là /uploads/{fileName}
            var imageUrl = $"/uploads/{fileName}";
            return new Response<string>(imageUrl);
        }

        // Upload YouTube link and return the link if valid
        public Task<Response<string>> UploadYoutubeLinkAsync(string youtubeUrl)
        {
            if (string.IsNullOrWhiteSpace(youtubeUrl) || !IsValidYoutubeUrl(youtubeUrl))
                return Task.FromResult(new Response<string>(400, "Link Youtube không hợp lệ"));

            return Task.FromResult(new Response<string>(youtubeUrl));
        }

        // Validate YouTube URL
        private bool IsValidYoutubeUrl(string url)
        {
            return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
                && (uriResult.Host.Contains("youtube.com") || uriResult.Host.Contains("youtu.be"));
        }
    }
}
