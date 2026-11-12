using Seeme.Domain.Constant;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.User;

public class CreateUserModel
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class CreateUserByAdminInput
{
    public string UserName { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public Enumerations.Role Role { get; set; }
    public int DepartmentId { get; set; }

    public string? PhoneNumber { get; set; }   // optional
    public string? Address { get; set; }       // optional
    public DateTime? BirthDate { get; set; }   // optional
    public string? Bio { get; set; }           // optional

    public Gender Gender { get; set; }
}

public class CreateUserResponseModel
{
    public bool IsSuccess { get; set; }
    public string EmailError { get; set; } = string.Empty;
    public string UsernameError { get; set; } = string.Empty;
}