using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;

namespace Seeme.Data.Repositories
{
    public class GardenRepository : BaseRepository<Garden>, IGardenRepository
    {
        public GardenRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
