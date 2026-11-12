using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Domain.IRepositories
{
    public interface IPlantProgressRepository : IBaseRepository<PlantProgress>
    {
        Task<List<PlantProgress>> GetByTeaIdAndOwnerIdAsync(int teaId);
        Task<PagingDataModel<PlantProgress>> GetPagingByTeaIdAndOwnerIdAsync(
            PaginationParam paginationParam, 
            int teaId);
    }
}
