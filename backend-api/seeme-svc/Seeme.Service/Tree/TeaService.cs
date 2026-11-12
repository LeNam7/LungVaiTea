using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Domain.Models.ReponseModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Seeme.Service.Tree
{
    public class TeaService : ITeaService
    {
        private readonly ITeaRepository _teaRepository;
        private readonly IGardenRepository _gardenRepository;
        private readonly ICategoryTeaRepository _categoryRepository;
        private readonly ITeaGroupRepository _teaGroupRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IOrderTeaRepository _orderTeaRepository;
        private readonly IProductRepository _productRepository;

        public TeaService(ITeaRepository teaRepository, IGardenRepository gardenRepository, ICategoryTeaRepository categoryRepository, IOrderRepository orderRepository, IOrderTeaRepository orderTeaRepository, ITeaGroupRepository teaGroupRepository, IProductRepository productRepository)
        {
            _teaRepository = teaRepository;
            _gardenRepository = gardenRepository;
            _categoryRepository = categoryRepository;
            _orderRepository = orderRepository;
            _orderTeaRepository = orderTeaRepository;
            _teaGroupRepository = teaGroupRepository;
            _productRepository = productRepository;
        }

        #region Garden Methods

        /// <summary>
        /// Thêm mới vườn trà
        /// </summary>
        public async Task<Response<Garden>> AddGardenAsync(Garden garden)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(garden.Name))
                {
                    return new Response<Garden>(400, "Tên vườn không được để trống");
                }

                if (string.IsNullOrWhiteSpace(garden.Address))
                {
                    return new Response<Garden>(400, "Địa chỉ vườn không được để trống");
                }

                var result = await _gardenRepository.CreateAsync(garden);
                return new Response<Garden>(result);
            }
            catch (Exception ex)
            {
                return new Response<Garden>(500, $"Lỗi khi thêm vườn: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin vườn trà
        /// </summary>
        public async Task<Response<Garden>> UpdateGardenAsync(int id, Garden garden)
        {
            try
            {
                var existingGarden = await _gardenRepository.GetByIdAsync(id);
                if (existingGarden == null)
                {
                    return new Response<Garden>(404, "Vườn không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(garden.Name))
                {
                    return new Response<Garden>(400, "Tên vườn không được để trống");
                }

                if (string.IsNullOrWhiteSpace(garden.Address))
                {
                    return new Response<Garden>(400, "Địa chỉ vườn không được để trống");
                }

                existingGarden.Name = garden.Name;
                existingGarden.Address = garden.Address;
                existingGarden.Description = garden.Description;
                existingGarden.IsActive = garden.IsActive;

                var result = await _gardenRepository.UpdateAsync(existingGarden);
                return new Response<Garden>(result);
            }
            catch (Exception ex)
            {
                return new Response<Garden>(500, $"Lỗi khi cập nhật vườn: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa vườn trà
        /// </summary>
        public async Task<Response<bool>> DeleteGardenAsync(int id)
        {
            try
            {
                var garden = await _gardenRepository.GetByIdAsync(id);
                if (garden == null)
                {
                    return new Response<bool>(404, "Vườn không tồn tại");
                }

                var result = await _gardenRepository.DeleteByIdAsync(id);
                return new Response<bool>(result);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa vườn: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết vườn trà theo ID
        /// </summary>
        public async Task<Response<Garden>> GetGardenByIdAsync(int id)
        {
            try
            {
                var garden = await _gardenRepository.GetByIdAsync(id);
                if (garden == null)
                {
                    return new Response<Garden>(404, "Vườn không tồn tại");
                }

                return new Response<Garden>(garden);
            }
            catch (Exception ex)
            {
                return new Response<Garden>(500, $"Lỗi khi lấy thông tin vườn: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách vườn trà phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<Garden>>> GetGardensPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                var result = await _gardenRepository.GetPagingAsync<Garden>(paginationParam);
                return new Response<PagingDataModel<Garden>>(result);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<Garden>>(500, $"Lỗi khi lấy danh sách vườn: {ex.Message}");
            }
        }

        #endregion

        #region CategoryTea Methods

        /// <summary>
        /// Thêm mới phân loại cây trà
        /// </summary>
        public async Task<Response<CategoryTea>> AddCategoryTeaAsync(CategoryTea category)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(category.Name))
                {
                    return new Response<CategoryTea>(400, "Tên phân loại không được để trống");
                }

                var result = await _categoryRepository.CreateAsync(category);
                return new Response<CategoryTea>(result);
            }
            catch (Exception ex)
            {
                return new Response<CategoryTea>(500, $"Lỗi khi thêm phân loại: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin phân loại cây trà
        /// </summary>
        public async Task<Response<CategoryTea>> UpdateCategoryTeaAsync(int id, CategoryTea category)
        {
            try
            {
                var existingCategory = await _categoryRepository.GetByIdAsync(id);
                if (existingCategory == null)
                {
                    return new Response<CategoryTea>(404, "Phân loại không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(category.Name))
                {
                    return new Response<CategoryTea>(400, "Tên phân loại không được để trống");
                }

                existingCategory.Name = category.Name;
                existingCategory.Group = category.Group;
                existingCategory.Description = category.Description;
                existingCategory.ImageUrl = category.ImageUrl;
                existingCategory.IsActive = category.IsActive;

                var result = await _categoryRepository.UpdateAsync(existingCategory);
                return new Response<CategoryTea>(result);
            }
            catch (Exception ex)
            {
                return new Response<CategoryTea>(500, $"Lỗi khi cập nhật phân loại: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa phân loại cây trà
        /// </summary>
        public async Task<Response<bool>> DeleteCategoryTeaAsync(int id)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category == null)
                {
                    return new Response<bool>(404, "Phân loại không tồn tại");
                }

                var result = await _categoryRepository.DeleteByIdAsync(id);
                return new Response<bool>(result);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa phân loại: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết phân loại cây trà theo ID
        /// </summary>
        public async Task<Response<CategoryTea>> GetCategoryTeaByIdAsync(int id)
        {
            try
            {
                var category = await _categoryRepository.GetByIdAsync(id);
                if (category == null)
                {
                    return new Response<CategoryTea>(404, "Phân loại không tồn tại");
                }

                return new Response<CategoryTea>(category);
            }
            catch (Exception ex)
            {
                return new Response<CategoryTea>(500, $"Lỗi khi lấy thông tin phân loại: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách phân loại cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<CategoryTea>>> GetCategoryTeasPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                var result = await _categoryRepository.GetPagingAsync<CategoryTea>(paginationParam);
                return new Response<PagingDataModel<CategoryTea>>(result);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<CategoryTea>>(500, $"Lỗi khi lấy danh sách phân loại: {ex.Message}");
            }
        }

        #endregion

        #region TeaGroup Methods

        private static string NormalizeTeaGroupSlug(string? slug)
        {
            return slug?.Trim().ToLowerInvariant() ?? string.Empty;
        }

        private static bool IsValidTeaGroupSlug(string slug)
        {
            return slug.Length > 0
                && slug.All(c => (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-');
        }

        /// <summary>
        /// Thêm mới nhóm trà
        /// </summary>
        public async Task<Response<TeaGroup>> AddTeaGroupAsync(TeaGroup group)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(group.Name))
                {
                    return new Response<TeaGroup>(400, "Tên nhóm trà không được để trống");
                }

                group.Slug = NormalizeTeaGroupSlug(group.Slug);
                if (!IsValidTeaGroupSlug(group.Slug))
                {
                    return new Response<TeaGroup>(400, "Slug nhóm trà không hợp lệ (chỉ gồm chữ thường, số và dấu gạch ngang)");
                }

                if (await _teaGroupRepository.ExistAsync(x => x.Slug == group.Slug))
                {
                    return new Response<TeaGroup>(400, "Slug nhóm trà đã tồn tại");
                }

                var result = await _teaGroupRepository.CreateAsync(group);
                return new Response<TeaGroup>(result);
            }
            catch (Exception ex)
            {
                return new Response<TeaGroup>(500, $"Lỗi khi thêm nhóm trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin nhóm trà (không đổi được slug)
        /// </summary>
        public async Task<Response<TeaGroup>> UpdateTeaGroupAsync(string slug, TeaGroup group)
        {
            try
            {
                var normalizedSlug = NormalizeTeaGroupSlug(slug);
                var existingGroup = await _teaGroupRepository.GetBySlugAsync(normalizedSlug);
                if (existingGroup == null)
                {
                    return new Response<TeaGroup>(404, "Nhóm trà không tồn tại");
                }

                if (!string.IsNullOrWhiteSpace(group.Slug) && NormalizeTeaGroupSlug(group.Slug) != normalizedSlug)
                {
                    return new Response<TeaGroup>(400, "Không thể đổi slug của nhóm trà");
                }

                if (string.IsNullOrWhiteSpace(group.Name))
                {
                    return new Response<TeaGroup>(400, "Tên nhóm trà không được để trống");
                }

                existingGroup.Name = group.Name;
                existingGroup.Description = group.Description;
                existingGroup.ImageUrl = group.ImageUrl;
                existingGroup.SortOrder = group.SortOrder;
                existingGroup.IsActive = group.IsActive;

                var result = await _teaGroupRepository.UpdateAsync(existingGroup);
                return new Response<TeaGroup>(result);
            }
            catch (Exception ex)
            {
                return new Response<TeaGroup>(500, $"Lỗi khi cập nhật nhóm trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa nhóm trà (xóa mềm; chặn xóa khi còn sản phẩm thuộc nhóm — từ tái cấu trúc 1/11/2026, sản phẩm trỏ thẳng tới nhóm qua GroupId)
        /// </summary>
        public async Task<Response<bool>> DeleteTeaGroupAsync(string slug)
        {
            try
            {
                var normalizedSlug = NormalizeTeaGroupSlug(slug);
                var group = await _teaGroupRepository.GetBySlugAsync(normalizedSlug);
                if (group == null)
                {
                    return new Response<bool>(404, "Nhóm trà không tồn tại");
                }

                if (await _productRepository.ExistAsync(x => x.GroupId == normalizedSlug))
                {
                    return new Response<bool>(400, "Nhóm còn sản phẩm, không thể xóa");
                }

                group.IsDelete = true;
                await _teaGroupRepository.UpdateAsync(group);
                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa nhóm trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết nhóm trà theo slug
        /// </summary>
        public async Task<Response<TeaGroup>> GetTeaGroupBySlugAsync(string slug)
        {
            try
            {
                var group = await _teaGroupRepository.GetBySlugAsync(NormalizeTeaGroupSlug(slug));
                if (group == null)
                {
                    return new Response<TeaGroup>(404, "Nhóm trà không tồn tại");
                }

                return new Response<TeaGroup>(group);
            }
            catch (Exception ex)
            {
                return new Response<TeaGroup>(500, $"Lỗi khi lấy thông tin nhóm trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách nhóm trà phân trang (20 bản ghi/trang, mặc định xếp theo SortOrder)
        /// </summary>
        public async Task<Response<PagingDataModel<TeaGroup>>> GetTeaGroupsPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                if (string.IsNullOrWhiteSpace(paginationParam.OrderBy))
                {
                    paginationParam.OrderBy = "SortOrder";
                }

                var result = await _teaGroupRepository.GetPagingAsync<TeaGroup>(paginationParam);
                return new Response<PagingDataModel<TeaGroup>>(result);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<TeaGroup>>(500, $"Lỗi khi lấy danh sách nhóm trà: {ex.Message}");
            }
        }

        #endregion

        #region Tea Methods

        /// <summary>
        /// Thêm mới cây trà
        /// </summary>
        public async Task<Response<Tea>> AddTeaAsync(Tea tea)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(tea.Name))
                {
                    return new Response<Tea>(400, "Tên cây trà không được để trống");
                }

                if (tea.GardenId <= 0)
                {
                    return new Response<Tea>(400, "Mã vườn không hợp lệ");
                }

                var gardenExists = await _gardenRepository.ExistAsync(g => g.Id == tea.GardenId);
                if (!gardenExists)
                {
                    return new Response<Tea>(404, "Vườn không tồn tại");
                }

                var result = await _teaRepository.CreateAsync(tea);
                return new Response<Tea>(result);
            }
            catch (Exception ex)
            {
                return new Response<Tea>(500, $"Lỗi khi thêm cây trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin cây trà
        /// </summary>
        public async Task<Response<Tea>> UpdateTeaAsync(int id, Tea tea)
        {
            try
            {
                var existingTea = await _teaRepository.GetByIdAsync(id);
                if (existingTea == null)
                {
                    return new Response<Tea>(404, "Cây trà không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(tea.Name))
                {
                    return new Response<Tea>(400, "Tên cây trà không được để trống");
                }

                if (tea.GardenId <= 0)
                {
                    return new Response<Tea>(400, "Mã vườn không hợp lệ");
                }

                var gardenExists = await _gardenRepository.ExistAsync(g => g.Id == tea.GardenId);
                if (!gardenExists)
                {
                    return new Response<Tea>(404, "Vườn không tồn tại");
                }

                existingTea.Name = tea.Name;
                existingTea.CategoryIds = tea.CategoryIds;
                existingTea.Price = tea.Price;
                existingTea.GardenId = tea.GardenId;
                existingTea.YearOld = tea.YearOld;
                existingTea.Description = tea.Description;
                existingTea.Long = tea.Long;
                existingTea.Lat = tea.Lat;
                existingTea.Aspect = tea.Aspect;
                existingTea.IsActive = tea.IsActive;
                existingTea.PackageId = tea.PackageId;
                existingTea.Sold = tea.Sold;
                existingTea.Owner = tea.Owner;
                existingTea.OwnershipFromDate = tea.OwnershipFromDate;
                existingTea.OwnershipToDate = tea.OwnershipToDate;
                existingTea.Images = tea.Images;
                existingTea.Volume = tea.Volume;
                existingTea.Type = tea.Type;

                var result = await _teaRepository.UpdateAsync(existingTea);
                return new Response<Tea>(result);
            }
            catch (Exception ex)
            {
                return new Response<Tea>(500, $"Lỗi khi cập nhật cây trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa cây trà
        /// </summary>
        public async Task<Response<bool>> DeleteTeaAsync(int id)
        {
            try
            {
                var tea = await _teaRepository.GetByIdAsync(id);
                if (tea == null)
                {
                    return new Response<bool>(404, "Cây trà không tồn tại");
                }

                var result = await _teaRepository.DeleteByIdAsync(id);
                return new Response<bool>(result);
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa cây trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết cây trà theo ID
        /// </summary>
        public async Task<Response<Tea>> GetTeaByIdAsync(int id)
        {
            try
            {
                var tea = await _teaRepository.GetByIdAsync(id);
                if (tea == null)
                {
                    return new Response<Tea>(404, "Cây trà không tồn tại");
                }

                return new Response<Tea>(tea);
            }
            catch (Exception ex)
            {
                return new Response<Tea>(500, $"Lỗi khi lấy thông tin cây trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Cây trà theo ID người dùng (chủ sở hữu cây trà)
        /// </summary>
        public async Task<Response<TeaOwnerResponseModel>> GetTeaByUserIdAsync(int id)
        {
            try
            {
                var teas = _teaRepository.GetListAsync(x => x.Owner == id).ToList() ?? new List<Tea>();

                var orderOwners = _orderRepository.GetListAsync(x => x.UserId == id).ToList();

                var orderIds = orderOwners?.Select(x => x.Id).ToList() ?? new List<int>();

                var orderTeaOwners = orderIds.Any()
                    ? _orderTeaRepository.GetListAsync(x => orderIds.Contains(x.OrderId)).ToList()
                    : new List<OrderTea>();

                var response = new TeaOwnerResponseModel
                {
                    Teas = teas,
                    OrderDetails = orderTeaOwners
                };

                return new Response<TeaOwnerResponseModel>(response);
            }
            catch (Exception ex)
            {
                return new Response<TeaOwnerResponseModel>(500, $"Lỗi khi lấy thông tin cây trà: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách cây trà phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<Tea>>> GetTeasPagingAsync(PaginationParam param)
        {
            try
            {
                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                Expression<Func<Tea, bool>> expression = x =>
               (paginationParam.GardenId != null ? paginationParam.GardenId == x.GardenId : 0 == 0) && !x.IsDelete
               && (!string.IsNullOrEmpty(paginationParam.Keyword) ? x.Name.Contains(paginationParam.Keyword) : 0 == 0);

                var result = await _teaRepository.GetPagingAsync<Tea>(paginationParam, expression);
                return new Response<PagingDataModel<Tea>>(result);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<Tea>>(500, $"Lỗi khi lấy danh sách cây trà: {ex.Message}");
            }
        }

        #endregion
    }
}