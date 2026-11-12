using Seeme.Domain.Constant;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.User;

public class UpdateUserModel
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Bio { get; set; } = string.Empty;
    public string? Address { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; } = string.Empty;
    public Gender Gender { get; set; }
}

public class UpdateUserResponseModel
{
    public bool IsSuccess { get; set; }
    public string EmailError { get; set; } = string.Empty;
}

public class UpdateRoleDepartmentUserModel : UpdateUserModel
{
    public Enumerations.Role Role { get; set; }

    public int? DepartmentId { get; set; }
}