using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Seeme.Data.Repositories
{
    public class TeaRepository : BaseRepository<Tea>, ITeaRepository
    {
        public TeaRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
