using Seeme.Domain.Constant;
using Seeme.Domain.Extensions;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.User;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System;
using System.Linq.Expressions;

namespace Seeme.Service.User;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly UserSettings _userSettings;

    public UserService(
        IUserRepository userRepository,
        IOptions<UserSettings> userSettings
    )
    {
        _userRepository = userRepository;
        _userSettings = userSettings.Value;
    }

    public async Task<Response<PagingDataModel<ManaUserResponseModel>>> GetPaging(
        PaginationParam param,
        int currentUserId
    )
    {
        var resultData = new PagingDataModel<ManaUserResponseModel>();

        // Mặc định không filter
        Expression<Func<Domain.Entities.User, bool>>? filter = null;

        // If keyword provided, search by FullName or Email
        if (!string.IsNullOrWhiteSpace(param?.Keyword))
        {
            var keyword = param.Keyword.Trim();
            filter = u => u.FullName.Contains(keyword) || u.Email.Contains(keyword);
        }

        var pagingData =
            await _userRepository.GetPagingAsync<Domain.Entities.User>(param, filter);

        foreach (var item in pagingData.Data)
        {
            // Map available entity fields to response model safely
            var names = (item.FullName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var firstName = names.Length > 0 ? names[0] : string.Empty;
            var lastName = names.Length > 1 ? string.Join(' ', names.Skip(1)) : string.Empty;

            var userModel = new ManaUserResponseModel
            {
                Id = item.Id,
                UserName = item.Email, // fallback: use email as username if no username property
                FirstName = firstName,
                LastName = lastName,
                Email = item.Email,
                Role = item.Role,
                DepartmentId = null,
                DepartmentName = string.Empty,
                IsBlock = item.IsBlock,
            };
            resultData.Data.Add(userModel);
        }

        resultData.TotalPages = pagingData.TotalPages;
        resultData.TotalRecords = pagingData.TotalRecords;

        return new Response<PagingDataModel<ManaUserResponseModel>>(resultData);
    }

    public async Task<Response<UpdateUserResponseModel>> UpdateUserAsync(
        int id,
        UpdateUserModel model
    )
    {
        var user =
            await _userRepository.GetByIdAsync(id) ?? throw new ArgumentException("User not found");

        var existsEmail = await _userRepository.ExistAsync(u =>
            u.Email == model.Email && u.Id != id
        );

        if (existsEmail)
        {
            return new Response<UpdateUserResponseModel>(
                new UpdateUserResponseModel()
                {
                    IsSuccess = false,
                    EmailError = "Địa chỉ email đã tồn tại",
                }
            );
        }

        // Update available fields on entity
        user.FullName = $"{model.FirstName?.Trim() ?? string.Empty} {model.LastName?.Trim() ?? string.Empty}".Trim();
        user.BirthDate = model.BirthDate;
        user.Email = model.Email;
        user.PhoneNumber = model.PhoneNumber;
        user.Gender = model.Gender;
        // Bio/Address/Role/Department are not present on the current User entity;
        // ignore them to avoid compile/runtime errors.

        await _userRepository.UpdateAsync(user);

        return new Response<UpdateUserResponseModel>(
            new UpdateUserResponseModel() { IsSuccess = true }
        );
    }

    public async Task<Response<CreateUserResponseModel>> AddNewUserByAdmin(int userId, CreateUserByAdminInput model)
    {
        // validate caller existence
        var caller = await _userRepository.GetByIdAsync(userId);
        if (caller == null)
        {
            return new Response<CreateUserResponseModel>(StatusCodes.Status401Unauthorized, "Caller not found");
        }

        var existsEmail = await _userRepository.ExistAsync(u =>
            u.Email == model.Email
        );

        if (existsEmail)
        {
            return new Response<CreateUserResponseModel>(
                new CreateUserResponseModel()
                {
                    IsSuccess = false,
                    EmailError = "Địa chỉ email đã tồn tại",
                }
            );
        }

        if (string.IsNullOrWhiteSpace(_userSettings.DefaultPassword))
        {
            throw new InvalidOperationException(
                "Chưa cấu hình UserSettings__DefaultPassword trong .env");
        }

        var newUser = new Domain.Entities.User
        {
            FullName = $"{model.FirstName?.Trim() ?? string.Empty} {model.LastName?.Trim() ?? string.Empty}".Trim(),
            Email = model.Email,
            PhoneNumber = model.PhoneNumber ?? string.Empty,
            BirthDate = model.BirthDate,
            Gender = model.Gender,
            // Default password
            Password = BcryptHasher.HashPassword(_userSettings.DefaultPassword),
        };
        await _userRepository.CreateAsync(newUser);

        return new Response<CreateUserResponseModel>(
            new CreateUserResponseModel() { IsSuccess = true }
        );
    }

    public async Task<Response<UserResponseModel>> GetUserByIdAsync(int id)
    {
        var user =
            await _userRepository.GetByIdAsync(id) ?? throw new ArgumentException("User not found");

        var entity = MapToResponseModel(user, string.Empty);

        return new Response<UserResponseModel>(entity);
    }

    private static UserResponseModel MapToResponseModel(
        Domain.Entities.User user,
        string departmentName
    )
    {
        var names = (user.FullName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var firstName = names.Length > 0 ? names[0] : string.Empty;
        var lastName = names.Length > 1 ? string.Join(' ', names.Skip(1)) : string.Empty;

        return new UserResponseModel
        {
            Id = user.Id,
            UserName = user.Email, // fallback
            FirstName = firstName,
            LastName = lastName,
            BirthDate = user.BirthDate,
            Gender = user.Gender,
            Email = user.Email,
            Role = user.Role,
            DepartmentId = null,
            DepartmentName = departmentName,
            Bio = string.Empty,
            PhoneNumber = user.PhoneNumber,
            Address = string.Empty,
            IsBlock = user.IsBlock,
        };
    }

    public async Task<Response<bool>> DeleteUser(int id)
    {
        try
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return new Response<bool>(
                    StatusCodes.Status404NotFound,
                    "Người dùng không tồn tại"
                );
            }

            // If BaseEntity contains IsDelete, use it for soft-delete
            if (user.IsDelete)
            {
                return new Response<bool>(
                    StatusCodes.Status400BadRequest,
                    "Người dùng đã bị xóa"
                );
            }

            // Soft delete
            user.IsDelete = true;
            user.UpdatedDate = DateTime.Now;
            await _userRepository.UpdateAsync(user);

            return new Response<bool>(true);
        }
        catch (Exception ex)
        {
            return new Response<bool>(
                StatusCodes.Status500InternalServerError,
                $"Lỗi khi xóa người dùng: {ex.Message}"
            );
        }
    }

    public async Task<Response<bool>> BlockUserAsync(int id, int currentUserId)
    {
        try
        {
            var currentUser = await _userRepository.GetByIdAsync(currentUserId);
            if (currentUser == null)
            {
                return new Response<bool>(
                    StatusCodes.Status403Forbidden,
                    "Không thể xác định người thực hiện hành động"
                );
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
            {
                return new Response<bool>(
                    StatusCodes.Status404NotFound,
                    "Người dùng không tồn tại"
                );
            }

            user.IsBlock = !user.IsBlock;
            user.FailedLoginAttempts = 0;
            user.UpdatedDate = DateTime.Now;
            await _userRepository.UpdateAsync(user);

            return new Response<bool>(true);
        }
        catch (Exception ex)
        {
            return new Response<bool>(
                StatusCodes.Status500InternalServerError,
                $"Lỗi khi khóa/mở khóa tài khoản: {ex.Message}"
            );
        }
    }
}