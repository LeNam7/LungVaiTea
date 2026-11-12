using Seeme.Domain.Entities;

namespace Seeme.Domain.IRepositories
{
    public interface ITeaGroupRepository : IBaseRepository<TeaGroup>
    {
        Task<TeaGroup?> GetBySlugAsync(string slug);
    }
}
