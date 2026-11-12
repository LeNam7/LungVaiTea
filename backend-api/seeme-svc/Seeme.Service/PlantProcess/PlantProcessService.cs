using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.PlantProgressModel;

namespace Seeme.Service.PlantProcess
{
    public class PlantProcessService : IPlantProcessService
    {
        private readonly IPlantProgressRepository _plantProgressRepository;

        public PlantProcessService(IPlantProgressRepository plantProgressRepository)
        {
            _plantProgressRepository = plantProgressRepository;
        }

        public async Task<PlantProgressResponse> AddAsync(CreatePlantProgressRequest request)
        {
            var plantProgress = new PlantProgress
            {
                TeaId = request.TeaId,
                Titile = request.Title,
                Content = request.Content,
                Images = request.Images,
                CreatedDate = DateTime.Now,
                IsDelete = false
            };

            var result = await _plantProgressRepository.CreateAsync(plantProgress);
            return result.ToResponse();
        }

        public async Task<PlantProgressResponse> UpdateAsync(UpdatePlantProgressRequest request)
        {
            var existingProgress = await _plantProgressRepository.GetByIdAsync(request.Id);
            if (existingProgress == null || existingProgress.IsDelete)
            {
                throw new KeyNotFoundException($"Plant progress with ID {request.Id} not found");
            }

            existingProgress.Titile = request.Title;
            existingProgress.Content = request.Content;
            existingProgress.Images = request.Images;
            existingProgress.UpdatedDate = DateTime.Now;

            var result = await _plantProgressRepository.UpdateAsync(existingProgress);
            return result.ToResponse();
        }

        public async Task<PagingDataModel<PlantProgressResponse>> GetPagingAsync(PaginationParam paginationParam, int teaId)
        {
            var pagingResult = await _plantProgressRepository.GetPagingByTeaIdAndOwnerIdAsync(
                paginationParam, teaId);

            return new PagingDataModel<PlantProgressResponse>(
                paginationParam.PageSize,
                pagingResult.TotalRecords,
                pagingResult.Data.ToResponseList()
            );
        }

        public async Task<List<PlantProgressResponse>> GetByTeaIdAndOwnerIdAsync(int teaId)
        {
            var plantProgresses = await _plantProgressRepository.GetByTeaIdAndOwnerIdAsync(teaId);
            return plantProgresses.ToResponseList();
        }
    }
}