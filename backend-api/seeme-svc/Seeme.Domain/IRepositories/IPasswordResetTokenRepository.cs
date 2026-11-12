using Seeme.Domain.Entities;

namespace Seeme.Domain.IRepositories;

public interface IPasswordResetTokenRepository : IBaseRepository<PasswordResetToken>
{
    Task InvalidateUserTokensAsync(int userId);
}


