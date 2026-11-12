using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Blog;
using Seeme.Domain.Models.ReponseModel;

namespace Seeme.Service.BlogService
{
    public interface IBlogService
    {
        Task<Response<PagingDataModel<Domain.Entities.Blog>>> GetPaging(PaginationParam param);
        Task<Response<Domain.Entities.Blog>> GetByIdAsync(int id);
        Task<Response<int>> CreateAsync(CreateBlogInput model, int currentUserId);
        Task<Response<bool>> UpdateAsync(int id, UpdateBlogInput model, int currentUserId);
        Task<Response<bool>> DeleteAsync(int id, int currentUserId);
        Task<Response<bool>> SendContactAsync(Contact contact);
        Task<Response<PagingDataModel<Contact>>> GetContactsPaging(PaginationParam param);
    }
}