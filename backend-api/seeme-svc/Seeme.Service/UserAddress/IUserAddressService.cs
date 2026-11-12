using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Domain.Models.ReponseModel;

namespace Seeme.Service.UserAddressService
{
    public interface IUserAddressService
    {
        Task<Response<bool>> AddUserAddressAsync(int userId, UserAddress address);
        Task<Response<bool>> UpdateUserAddressAsync(int addressId, UserAddress address);
        Task<Response<bool>> DeleteUserAddressAsync(int addressId);
        Task<Response<List<UserAddress>>> GetUserAddressesAsync(int userId);
        Task<Response<UserAddress>> GetDefaultUserAddressAsync(int userId);
        Task<Response<UserAddress>> GetUserAddressByIdAsync(int addressId);
        Task<Response<bool>> SetDefaultAddressAsync(int addressId, int userId);
        Task<Response<PagingDataModel<UserAddress>>> GetUserAddressesPagingAsync(int userId, PaginationParam param);
    }
}
