using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Internal;
using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.Extensions;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using System.Linq.Expressions;

namespace Seeme.Data.Repositories
{
    public class BlogRepository : BaseRepository<Blog>, IBlogRepository
    {
        public BlogRepository(ApplicationDbContext context) : base(context)
        {
        }

        public async Task<PagingDataModel<Blog>> GetPagingByTypeAsync(
            PaginationParam paginationParam)
        {
            Expression<Func<Blog, bool>> expression = x =>
                (paginationParam.Type != null ? paginationParam.Type == x.Type : 0 == 0)  && !x.IsDelete;

            return await GetPagingAsync<Blog>(paginationParam, expression);
        }
    }
}
