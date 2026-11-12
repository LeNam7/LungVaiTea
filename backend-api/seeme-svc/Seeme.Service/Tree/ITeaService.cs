using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Order;
using Seeme.Domain.Models.ReponseModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Service.Tree
{
    public interface ITeaService
    {
        #region Garden
        Task<Response<Garden>> AddGardenAsync(Garden garden);
        Task<Response<Garden>> UpdateGardenAsync(int id, Garden garden);
        Task<Response<bool>> DeleteGardenAsync(int id);
        Task<Response<Garden>> GetGardenByIdAsync(int id);
        Task<Response<PagingDataModel<Garden>>> GetGardensPagingAsync(PaginationParam param);
        #endregion

        #region CategoryTea
        Task<Response<CategoryTea>> AddCategoryTeaAsync(CategoryTea category);
        Task<Response<CategoryTea>> UpdateCategoryTeaAsync(int id, CategoryTea category);
        Task<Response<bool>> DeleteCategoryTeaAsync(int id);
        Task<Response<CategoryTea>> GetCategoryTeaByIdAsync(int id);
        Task<Response<PagingDataModel<CategoryTea>>> GetCategoryTeasPagingAsync(PaginationParam param);
        #endregion

        #region TeaGroup
        Task<Response<TeaGroup>> AddTeaGroupAsync(TeaGroup group);
        Task<Response<TeaGroup>> UpdateTeaGroupAsync(string slug, TeaGroup group);
        Task<Response<bool>> DeleteTeaGroupAsync(string slug);
        Task<Response<TeaGroup>> GetTeaGroupBySlugAsync(string slug);
        Task<Response<PagingDataModel<TeaGroup>>> GetTeaGroupsPagingAsync(PaginationParam param);
        #endregion

        #region Tea
        Task<Response<Tea>> AddTeaAsync(Tea tea);
        Task<Response<Tea>> UpdateTeaAsync(int id, Tea tea);
        Task<Response<bool>> DeleteTeaAsync(int id);
        Task<Response<Tea>> GetTeaByIdAsync(int id);
        Task<Response<PagingDataModel<Tea>>> GetTeasPagingAsync(PaginationParam param);
        Task<Response<TeaOwnerResponseModel>> GetTeaByUserIdAsync(int id);
        #endregion
    }
}
