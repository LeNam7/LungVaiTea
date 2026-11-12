using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.Models.ReponseModel
{
    public class BaseResponse
    {
        public int StatusCode { get; set; }
        public string Message { get; set; }

        protected BaseResponse()
        {
            StatusCode = 200;
            Message = "Success";
        }

        public BaseResponse(int statusCode, string? message = null)
        {
            StatusCode = statusCode;
            switch (statusCode)
            {
                case 400:
                    Message = message ?? "Bad Request";
                    break;
                case 401:
                    Message = message ?? "Unauthorized";
                    break;
                case 403:
                    Message = message ?? "Forbidden";
                    break;
                case 404:
                    Message = message ?? "Not Found";
                    break;
                case 409:
                    Message = message ?? "Conflict";
                    break;
                case 500:
                    Message = message ?? "Internal Server Error";
                    break;
                default:
                    Message = message ?? "Success";
                    break;
            }
        }
    }
}
