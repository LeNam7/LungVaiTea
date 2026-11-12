using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace Seeme.Data.Repositories;

public class PasswordResetTokenRepository
    : BaseRepository<PasswordResetToken>, IPasswordResetTokenRepository
{
    public PasswordResetTokenRepository(ApplicationDbContext context)
        : base(context) { }

    public async Task InvalidateUserTokensAsync(int userId)
    {
        var tokens = await GetListAsync(t => t.UserId == userId && !t.IsUsed)
            .ToListAsync();

        if (tokens.Count == 0)
        {
            return;
        }

        foreach (var token in tokens)
        {
            token.IsUsed = true;
        }

        await UpdateListAsync(tokens);
    }
}


