using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Data.Repositories
{
    public class PlantProgressRepository : BaseRepository<PlantProgress>, IPlantProgressRepository
    {
        public PlantProgressRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<List<PlantProgress>> GetByTeaIdAndOwnerIdAsync(int teaId)
        {
            return await Task.FromResult(
                GetListAsync(x => x.TeaId == teaId && !x.IsDelete)
                    .OrderByDescending(x => x.CreatedDate)
                    .ToList()
            );
        }

        public async Task<PagingDataModel<PlantProgress>> GetPagingByTeaIdAndOwnerIdAsync(
            PaginationParam paginationParam, 
            int teaId)
        {
            Expression<Func<PlantProgress, bool>> expression = x => 
                x.TeaId == teaId && !x.IsDelete;

            return await GetPagingAsync<PlantProgress>(paginationParam, expression);
        }
    }
}
