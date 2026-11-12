using Seeme.Domain.Entities;

namespace Seeme.Domain.IRepositories;

public interface IRefreshTokenRepository : IBaseRepository<RefreshToken>
{
    Task RevokeAllUserTokens(int userId);
}
