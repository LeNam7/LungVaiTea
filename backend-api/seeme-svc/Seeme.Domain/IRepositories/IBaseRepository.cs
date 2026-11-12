using System.Linq.Expressions;
using Seeme.Domain.Entities;
using Seeme.Domain.Models;

namespace Seeme.Domain.IRepositories;

/// <summary>
/// Base repository interface that defines common CRUD and query operations
/// </summary>
/// <typeparam name="T">Entity type that inherits from BaseEntity</typeparam>
public interface IBaseRepository<T>
    where T : BaseEntity
{
    /// <summary>
    /// Retrieves an entity by its ID
    /// </summary>
    /// <ParamPaging name="id">The ID of the entity to retrieve</ParamPaging>
    /// <returns>The entity if found, null otherwise. Entity will be detached from context</returns>
    Task<T?> GetByIdAsync(int id);

    /// <summary>
    /// Creates a new entity in the database
    /// </summary>
    /// <ParamPaging name="entity">The entity to create</ParamPaging>
    /// <returns>The created entity with its new ID and CreatedDate set</returns>
    Task<T> CreateAsync(T entity);

    /// <summary>
    /// Creates multiple entities in a single transaction
    /// </summary>
    /// <ParamPaging name="entities">List of entities to create. IDs will be set to 0 and CreatedDate will be set</ParamPaging>
    /// <returns>True if transaction succeeds, false if it fails</returns>
    Task<bool> CreateListAsync(List<T> entities);

    /// <summary>
    /// Updates an existing entity in the database
    /// </summary>
    /// <ParamPaging name="entity">The entity to update. UpdatedDate will be set automatically</ParamPaging>
    /// <returns>The updated entity</returns>
    Task<T> UpdateAsync(T entity);

    /// <summary>
    /// Updates multiple entities in a single transaction
    /// </summary>
    /// <ParamPaging name="entities">List of entities to update. UpdatedDate will be set for each entity</ParamPaging>
    /// <returns>True if transaction succeeds, false if it fails</returns>
    Task<bool> UpdateListAsync(List<T> entities);

    /// <summary>
    /// Deletes an entity from the database
    /// </summary>
    /// <ParamPaging name="entity">The entity to delete</ParamPaging>
    Task DeleteAsync(T entity);

    /// <summary>
    /// Deletes an entity by its ID
    /// </summary>
    /// <ParamPaging name="id">The ID of the entity to delete</ParamPaging>
    /// <returns>True if entity was found and deleted, false if not found</returns>
    Task<bool> DeleteByIdAsync(int id);

    /// <summary>
    /// Deletes multiple entities in a single transaction
    /// </summary>
    /// <ParamPaging name="entities">List of entities to delete</ParamPaging>
    /// <returns>True if transaction succeeds, false if it fails</returns>
    Task<bool> DeleteListAsync(List<T> entities);

    /// <summary>
    /// Retrieves a single entity based on a condition with optional ordering
    /// </summary>
    /// <ParamPaging name="expression">The condition to filter by</ParamPaging>
    /// <ParamPaging name="orderBy">Optional ordering expression (e.g., "Name desc")</ParamPaging>
    /// <returns>The first matching entity or null. Uses AsNoTracking for better performance</returns>
    Task<T?> GetAsync(Expression<Func<T, bool>> expression, string? orderBy = null);

    /// <summary>
    /// Retrieves a queryable collection of entities based on a condition
    /// </summary>
    /// <ParamPaging name="expression">The condition to filter by</ParamPaging>
    /// <returns>IQueryable of matching entities for further querying</returns>
    IQueryable<T> GetListAsync(Expression<Func<T, bool>>? expression = null);

    /// <summary>
    /// Counts the number of entities matching the specified condition
    /// </summary>
    /// <ParamPaging name="expression">The condition to count by</ParamPaging>
    /// <returns>The count of matching entities</returns>
    Task<int> CountAsync(Expression<Func<T, bool>>? expression = null);

    /// <summary>
    /// Checks if any entity matches the specified condition
    /// </summary>
    /// <ParamPaging name="expression">The condition to check</ParamPaging>
    /// <returns>True if any entity matches, false otherwise</returns>
    Task<bool> ExistAsync(Expression<Func<T, bool>> expression);

    /// <summary>
    /// Retrieves a paged collection of entities with optional filtering conditions
    /// </summary>
    /// <ParamPaging name="paginationParam">Pagination parameters (page size, index, and sorting)</ParamPaging>
    /// <ParamPaging name="expression">Optional conditions to filter the results</ParamPaging>
    /// <returns>A PagingDataModel containing the paged results and total count</returns>
    Task<PagingDataModel<TEntity>> GetPagingAsync<TEntity>(
        PaginationParam paginationParam,
        Expression<Func<TEntity, bool>>? expression = null
    )
        where TEntity : BaseEntity;

    /// <summary>
    /// Executes a database transaction with the specified callback
    /// </summary>
    /// <ParamPaging name="callback">The async operation to execute within the transaction</ParamPaging>
    /// <returns>True if transaction succeeds, false if it fails or is rolled back</returns>
    Task<bool> UseDatabaseTransaction(Func<Task> callback);
}
