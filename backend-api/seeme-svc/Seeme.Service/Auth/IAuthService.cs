using Seeme.Domain.Models.Auth;
using Seeme.Domain.Models.ReponseModel;
using Seeme.Domain.Models.User;

namespace Seeme.Service.Auth;

public interface IAuthService
{
    Task<Response<LoginResponseModel>> HandleLogin(LoginModel model);
    Task<Response<string>> RefreshToken(RefreshTokenModel model);
    Task<Response<RegisterResponseModel>> CreateUserAsync(CreateUserModel model);
    Task<Response<ChangePasswordResponseModel>> ChangePasswordAsync(ChangePasswordInputModel model);
    Task<Response<string>> ForgotPasswordAsync(ForgotPasswordRequestModel model);
    Task<Response<ResetPasswordResponseModel>> ResetPasswordWithOtpAsync(ResetPasswordWithOtpModel model);
}