using Seeme.Domain.Constant;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Models.User;

public class UserResponseModel
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public Gender Gender { get; set; }
    public string Email { get; set; } = string.Empty;
    public Enumerations.Role Role { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; } = string.Empty;
    public string? Bio { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; } = string.Empty;
    public bool IsBlock { get; set; }
}

public class ManaUserResponseModel
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    public string FullName
    {
        get
        {
            return FirstName + " " + LastName;
        }
    }

    public string Email { get; set; } = string.Empty;
    public Enumerations.Role Role { get; set; }
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; } = string.Empty;
    public bool IsBlock { get; set; }
}

public class UserNameModel
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
}