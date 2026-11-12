using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;

namespace Seeme.Data.Repositories
{
    public class UserTrackingRepository : BaseRepository<UserTracking>, IUserTrackingRepository
    {
        public UserTrackingRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
