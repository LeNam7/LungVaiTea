namespace Seeme.Domain.Models.Auth;

public class LoginModel
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenModel
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class LoginResponseModel
{
    public bool Success { get; set; }
    public LoginTokenResponseModel Data { get; set; } = new LoginTokenResponseModel();
    public string Message { get; set; } = string.Empty;
}

public class LoginTokenResponseModel
{
    public int UserId { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
