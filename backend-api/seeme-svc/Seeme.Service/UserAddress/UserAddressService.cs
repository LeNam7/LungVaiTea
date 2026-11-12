using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.ReponseModel;
using System.Linq.Expressions;

namespace Seeme.Service.UserAddressService
{
    public class UserAddressService : IUserAddressService
    {
        private readonly IUserAddressRepository _userAddressRepository;
        private readonly IUserRepository _userRepository;

        public UserAddressService(IUserAddressRepository userAddressRepository, IUserRepository userRepository)
        {
            _userAddressRepository = userAddressRepository;
            _userRepository = userRepository;
        }

        /// <summary>
        /// Thêm địa chỉ giao hàng mới cho người dùng
        /// </summary>
        public async Task<Response<bool>> AddUserAddressAsync(int userId, UserAddress address)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new Response<bool>(404, "Người dùng không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(address.CustomerName) ||
                    string.IsNullOrWhiteSpace(address.Address) ||
                    string.IsNullOrWhiteSpace(address.Phone))
                {
                    return new Response<bool>(400, "Thông tin địa chỉ không được để trống");
                }

                address.UserId = userId;
                address.CreatedDate = DateTime.Now;
                address.IsDelete = false;

                // If this is set as default, unset other default addresses
                if (address.IsDefault)
                {
                    var existingAddresses = _userAddressRepository.GetListAsync(ua => ua.UserId == userId && ua.IsDefault && !ua.IsDelete);
                    foreach (var existingAddress in existingAddresses)
                    {
                        existingAddress.IsDefault = false;
                        existingAddress.UpdatedDate = DateTime.Now;
                        await _userAddressRepository.UpdateAsync(existingAddress);
                    }
                }

                await _userAddressRepository.CreateAsync(address);
                return new Response<bool>(200, "Thêm địa chỉ thành công");
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi thêm địa chỉ: {ex.Message}");
            }
        }

        /// <summary>
        /// Cập nhật thông tin địa chỉ người dùng
        /// </summary>
        public async Task<Response<bool>> UpdateUserAddressAsync(int addressId, UserAddress address)
        {
            try
            {
                var existingAddress = await _userAddressRepository.GetByIdAsync(addressId);
                if (existingAddress == null)
                {
                    return new Response<bool>(404, "Địa chỉ không tồn tại");
                }

                if (string.IsNullOrWhiteSpace(address.CustomerName) ||
                    string.IsNullOrWhiteSpace(address.Address) ||
                    string.IsNullOrWhiteSpace(address.Phone))
                {
                    return new Response<bool>(400, "Thông tin địa chỉ không được để trống");
                }

                existingAddress.CustomerName = address.CustomerName;
                existingAddress.CityId = address.CityId;
                existingAddress.ProvinceId = address.ProvinceId;
                existingAddress.ProvinceName = address.ProvinceName;
                existingAddress.WardId = address.WardId;
                existingAddress.WardName = address.WardName;
                existingAddress.Address = address.Address;
                existingAddress.Phone = address.Phone;
                existingAddress.UpdatedDate = DateTime.Now;

                // If this is set as default, unset other default addresses
                if (address.IsDefault && !existingAddress.IsDefault)
                {
                    var otherAddresses = _userAddressRepository.GetListAsync(ua => ua.UserId == existingAddress.UserId && ua.IsDefault && ua.Id != addressId && !ua.IsDelete);
                    foreach (var otherAddress in otherAddresses)
                    {
                        otherAddress.IsDefault = false;
                        otherAddress.UpdatedDate = DateTime.Now;
                        await _userAddressRepository.UpdateAsync(otherAddress);
                    }
                }

                existingAddress.IsDefault = address.IsDefault;
                await _userAddressRepository.UpdateAsync(existingAddress);
                return new Response<bool>(200, "Cập nhật địa chỉ thành công");
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi cập nhật địa chỉ: {ex.Message}");
            }
        }

        /// <summary>
        /// Xóa địa chỉ người dùng
        /// </summary>
        public async Task<Response<bool>> DeleteUserAddressAsync(int addressId)
        {
            try
            {
                var address = await _userAddressRepository.GetByIdAsync(addressId);
                if (address == null)
                {
                    return new Response<bool>(404, "Địa chỉ không tồn tại");
                }

                address.IsDelete = true;
                address.UpdatedDate = DateTime.Now;
                await _userAddressRepository.UpdateAsync(address);
                return new Response<bool>(200, "Xóa địa chỉ thành công");
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi xóa địa chỉ: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy tất cả địa chỉ của một người dùng
        /// </summary>
        public async Task<Response<List<UserAddress>>> GetUserAddressesAsync(int userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new Response<List<UserAddress>>(404, "Người dùng không tồn tại");
                }

                var addresses = _userAddressRepository.GetListAsync(ua => ua.UserId == userId && !ua.IsDelete).ToList();
                return new Response<List<UserAddress>>(addresses);
            }
            catch (Exception ex)
            {
                return new Response<List<UserAddress>>(500, $"Lỗi khi lấy danh sách địa chỉ: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy địa chỉ mặc định của người dùng
        /// </summary>
        public async Task<Response<UserAddress>> GetDefaultUserAddressAsync(int userId)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new Response<UserAddress>(404, "Người dùng không tồn tại");
                }

                var defaultAddress = _userAddressRepository.GetListAsync(ua => ua.UserId == userId && ua.IsDefault && !ua.IsDelete).FirstOrDefault();
                if (defaultAddress == null)
                {
                    return new Response<UserAddress>(404, "Không có địa chỉ mặc định");
                }

                return new Response<UserAddress>(defaultAddress);
            }
            catch (Exception ex)
            {
                return new Response<UserAddress>(500, $"Lỗi khi lấy địa chỉ mặc định: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy chi tiết một địa chỉ
        /// </summary>
        public async Task<Response<UserAddress>> GetUserAddressByIdAsync(int addressId)
        {
            try
            {
                var address = await _userAddressRepository.GetByIdAsync(addressId);
                if (address == null || address.IsDelete)
                {
                    return new Response<UserAddress>(404, "Địa chỉ không tồn tại");
                }

                return new Response<UserAddress>(address);
            }
            catch (Exception ex)
            {
                return new Response<UserAddress>(500, $"Lỗi khi lấy thông tin địa chỉ: {ex.Message}");
            }
        }

        /// <summary>
        /// Đặt địa chỉ làm mặc định
        /// </summary>
        public async Task<Response<bool>> SetDefaultAddressAsync(int addressId, int userId)
        {
            try
            {
                var address = await _userAddressRepository.GetByIdAsync(addressId);
                if (address == null || address.IsDelete || address.UserId != userId)
                {
                    return new Response<bool>(404, "Địa chỉ không tồn tại");
                }

                // Unset current default address
                var currentDefault = _userAddressRepository.GetListAsync(ua => ua.UserId == userId && ua.IsDefault && !ua.IsDelete).FirstOrDefault();
                if (currentDefault != null)
                {
                    currentDefault.IsDefault = false;
                    currentDefault.UpdatedDate = DateTime.Now;
                    await _userAddressRepository.UpdateAsync(currentDefault);
                }

                // Set new default address
                address.IsDefault = true;
                address.UpdatedDate = DateTime.Now;
                await _userAddressRepository.UpdateAsync(address);

                return new Response<bool>(200, "Đặt địa chỉ mặc định thành công");
            }
            catch (Exception ex)
            {
                return new Response<bool>(500, $"Lỗi khi đặt địa chỉ mặc định: {ex.Message}");
            }
        }

        /// <summary>
        /// Lấy danh sách địa chỉ phân trang (20 bản ghi/trang)
        /// </summary>
        public async Task<Response<PagingDataModel<UserAddress>>> GetUserAddressesPagingAsync(int userId, PaginationParam param)
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user == null)
                {
                    return new Response<PagingDataModel<UserAddress>>(404, "Người dùng không tồn tại");
                }

                var paginationParam = param ?? new PaginationParam { PageIndex = 1, PageSize = 20 };
                if (paginationParam.PageSize == 0)
                {
                    paginationParam.PageSize = 20;
                }

                Expression<Func<UserAddress, bool>> filter = ua => ua.UserId == userId && !ua.IsDelete;
                var pagingData = await _userAddressRepository.GetPagingAsync<UserAddress>(paginationParam, filter);

                return new Response<PagingDataModel<UserAddress>>(pagingData);
            }
            catch (Exception ex)
            {
                return new Response<PagingDataModel<UserAddress>>(500, $"Lỗi khi lấy danh sách địa chỉ: {ex.Message}");
            }
        }
    }
}