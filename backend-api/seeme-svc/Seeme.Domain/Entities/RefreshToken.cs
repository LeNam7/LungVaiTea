using System;

namespace Seeme.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public string Token { get; set; }
    public DateTime ExpiryDate { get; set; }
    public int UserId { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime? RevokedDate { get; set; }
}
