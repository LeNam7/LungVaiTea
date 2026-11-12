using Microsoft.AspNetCore.Http;
using Seeme.Domain.Models.ReponseModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Service.Upload
{
    public interface IUploadService
    {
        Task<Response<string>> UploadImageAsync(IFormFile file);
        Task<Response<string>> UploadYoutubeLinkAsync(string youtubeUrl);
    }
}
