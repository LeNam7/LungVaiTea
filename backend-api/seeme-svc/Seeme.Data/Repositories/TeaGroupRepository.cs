using Microsoft.EntityFrameworkCore;
using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;

namespace Seeme.Data.Repositories
{
    public class TeaGroupRepository : BaseRepository<TeaGroup>, ITeaGroupRepository
    {
        public TeaGroupRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<TeaGroup?> GetBySlugAsync(string slug)
        {
            return await DbSet.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Slug == slug && !x.IsDelete);
        }
    }
}
