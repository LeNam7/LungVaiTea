using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace Seeme.Data.Repositories;

public class RefreshTokenRepository : BaseRepository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task RevokeAllUserTokens(int userId)
    {
        var userTokens = await GetListAsync(r => r.UserId == userId && !r.IsRevoked)
            .ToListAsync();

        foreach (var token in userTokens)
        {
            token.IsRevoked = true;
            token.RevokedDate = DateTime.UtcNow;
        }

        await UpdateListAsync(userTokens);
    }
}
