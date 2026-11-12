using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace Seeme.Data.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }
}

