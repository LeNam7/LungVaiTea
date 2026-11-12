using Seeme.Domain.Constant;
using Seeme.Domain.Models;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.User;

namespace Seeme.Service.User;

public interface IUserService
{
    Task<Response<PagingDataModel<ManaUserResponseModel>>> GetPaging(
        PaginationParam param,
        int currentUserId);
    Task<Response<UpdateUserResponseModel>> UpdateUserAsync(
       int id,
       UpdateUserModel model);
    Task<Response<CreateUserResponseModel>> AddNewUserByAdmin(int userId, CreateUserByAdminInput model);
    Task<Response<UserResponseModel>> GetUserByIdAsync(int id);
    Task<Response<bool>> DeleteUser(int id);
    Task<Response<bool>> BlockUserAsync(int id, int currentUserId);
}
