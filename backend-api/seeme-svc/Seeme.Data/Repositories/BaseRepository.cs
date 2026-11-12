using System.Linq.Expressions;
using Seeme.Data.Context;
using Seeme.Domain.Entities;
using Seeme.Domain.Extensions;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Seeme.Data.Repositories;

public abstract class BaseRepository<T> : IBaseRepository<T>
    where T : BaseEntity
{
    protected readonly ApplicationDbContext DbContext;
    protected readonly DbSet<T> DbSet;

    protected BaseRepository(ApplicationDbContext dbContext)
    {
        DbContext = dbContext;
        DbSet = dbContext.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        var entity = await DbSet.FindAsync(id);

        if (entity != null)
        {
            DbContext.Entry(entity).State = EntityState.Detached;
        }

        return entity;
    }

    public async Task<T> CreateAsync(T entity)
    {
        entity.Id = 0;
        entity.CreatedDate = DateTime.Now;

        DbSet.Add(entity);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
        return entity;
    }

    public async Task<bool> CreateListAsync(List<T> entities)
    {
        return await UseDatabaseTransaction(async () =>
        {
            if (entities.Any())
            {
                entities = entities
                    .Select(x =>
                    {
                        x.Id = 0;
                        x.CreatedDate = DateTime.Now;
                        return x;
                    })
                    .ToList();
            }
            await Task.Run(() => DbSet.AddRange(entities));
        });
    }

    public async Task<T> UpdateAsync(T entity)
    {
        entity.UpdatedDate = DateTime.Now;
        DbContext.Entry(entity).State = EntityState.Modified;

        DbSet.Update(entity);

        await DbContext.SaveChangesAsync().ConfigureAwait(false);
        return entity;
    }

    public async Task<bool> UpdateListAsync(List<T> entities)
    {
        return await UseDatabaseTransaction(async () =>
        {
            if (entities.Any())
            {
                entities = entities
                    .Select(x =>
                    {
                        x.UpdatedDate = DateTime.Now;
                        return x;
                    })
                    .ToList();
            }
            await Task.Run(() => DbSet.UpdateRange(entities));
        });
    }

    public async Task DeleteAsync(T entity)
    {
        DbSet.Remove(entity);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
    }

    public async Task<bool> DeleteByIdAsync(int id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null)
        {
            return false;
        }

        DbSet.Remove(entity);
        await DbContext.SaveChangesAsync().ConfigureAwait(false);
        return true;
    }

    public async Task<bool> DeleteListAsync(List<T> entities)
    {
        return await UseDatabaseTransaction(async () =>
        {
            await Task.Run(() => DbSet.RemoveRange(entities));
        });
    }

    public async Task<T?> GetAsync(Expression<Func<T, bool>> expression, string? orderBy = null)
    {
        IQueryable<T> query = DbSet.AsNoTracking().Where(expression);

        if (!string.IsNullOrEmpty(orderBy))
        {
            query = query.ApplySort(orderBy);
        }

        return await query.FirstOrDefaultAsync();
    }

    public IQueryable<T> GetListAsync(Expression<Func<T, bool>>? expression = null)
    {
        expression ??= (x => x.Id > 0);
        // Always filter out deleted items unless explicitly included in expression
        expression = expression.AndAlso(x => !x.IsDelete);
        var entities = DbSet.Where(expression);
        return entities;
    }

    public async Task<int> CountAsync(Expression<Func<T, bool>>? expression = null)
    {
        expression ??= (x => x.Id > 0);
        // Always filter out deleted items unless explicitly included in expression
        expression = expression.AndAlso(x => !x.IsDelete);
        return await DbSet.CountAsync(expression);
    }

    public async Task<bool> ExistAsync(Expression<Func<T, bool>> expression)
    {
        // Always filter out deleted items unless explicitly included in expression
        expression = expression.AndAlso(x => !x.IsDelete);
        return await DbSet.AnyAsync(expression);
    }

    public async Task<PagingDataModel<TEntity>> GetPagingAsync<TEntity>(
        PaginationParam paginationParam,
        Expression<Func<TEntity, bool>>? expression = null
    )
        where TEntity : BaseEntity
    {
        var dbSet = DbContext.Set<TEntity>();

        expression ??= (x => x.Id > 0);
        
        // Always filter out deleted items unless explicitly included in expression
        expression = expression.AndAlso(x => !x.IsDelete);
        
        if (!string.IsNullOrEmpty(paginationParam.Keyword))
        {
            var searchExpression = QueryableExtensions.BuildSearchExpression<TEntity>(
                paginationParam.Keyword
            );

            expression = expression.AndAlso(searchExpression);
        }

        var selectQuery = dbSet.Where(expression).ApplySort(orderBy: paginationParam.OrderBy);

        int totalRecord = await selectQuery.CountAsync();
        if (totalRecord <= 0)
            return new PagingDataModel<TEntity>();

        var skipRows = (paginationParam.PageIndex - 1) * paginationParam.PageSize;
        var collection = await selectQuery
            .Skip(skipRows)
            .Take(paginationParam.PageSize)
            .AsSplitQuery()
            .ToListAsync();

        return new PagingDataModel<TEntity>(
            pageSize: paginationParam.PageSize,
            totalRecordsCount: totalRecord,
            pagingData: collection
        );
    }

    public async Task<bool> UseDatabaseTransaction(Func<Task> callback)
    {
        using var transaction = await DbContext.Database.BeginTransactionAsync();

        try
        {
            await callback(); // gọi callback async

            await DbContext.SaveChangesAsync().ConfigureAwait(false);
            await transaction.CommitAsync().ConfigureAwait(false);
            return true;
        }
        catch
        {
            await transaction.RollbackAsync().ConfigureAwait(false);
            return false;
        }
    }
}
