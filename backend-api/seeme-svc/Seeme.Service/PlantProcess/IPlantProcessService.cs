using Seeme.Domain.Models;
using Seeme.Domain.Models.PlantProgressModel;

namespace Seeme.Service.PlantProcess
{
    public interface IPlantProcessService
    {
        Task<PlantProgressResponse> AddAsync(CreatePlantProgressRequest request);
        Task<PlantProgressResponse> UpdateAsync(UpdatePlantProgressRequest request);
        Task<PagingDataModel<PlantProgressResponse>> GetPagingAsync(PaginationParam paginationParam, int teaId);
        Task<List<PlantProgressResponse>> GetByTeaIdAndOwnerIdAsync(int teaId);
    }
}