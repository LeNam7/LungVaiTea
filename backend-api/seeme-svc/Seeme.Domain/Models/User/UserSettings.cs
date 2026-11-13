namespace Seeme.Domain.Models.User;

public class UserSettings
{
    /// <summary>Mật khẩu mặc định khi admin tạo user mới. Đặt qua biến môi trường UserSettings__DefaultPassword.</summary>
    public string DefaultPassword { get; set; } = string.Empty;
}
