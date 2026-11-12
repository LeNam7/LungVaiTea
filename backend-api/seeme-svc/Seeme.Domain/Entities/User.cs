using Seeme.Domain.Constant;
using Seeme.Domain.Extensions;
using static Seeme.Domain.Constant.Enumerations;

namespace Seeme.Domain.Entities
{
    public class User : BaseEntity
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public DateTime? BirthDate { get; set; }
        public Gender Gender { get; set; } = Gender.Other;
        public bool IsBlock { get; set; } = false;
        public int FailedLoginAttempts { get; set; } = 0;
    }
}


