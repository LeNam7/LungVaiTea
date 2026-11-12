using System.Security.Claims;
using Seeme.Domain.Entities;

namespace Seeme.Service.Auth;

public interface IJwtService
{
    string GenerateToken(Domain.Entities.User user);
    RefreshToken GenerateRefreshToken(int userId);
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
}