using Seeme.Domain.Entities;
using Seeme.Domain.Models;

namespace Seeme.Domain.IRepositories
{
    public interface IBlogRepository : IBaseRepository<Blog>
    {
        Task<PagingDataModel<Blog>> GetPagingByTypeAsync(
            PaginationParam paginationParam);
    }
}
