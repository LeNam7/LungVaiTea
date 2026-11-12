using System.Linq.Dynamic.Core;
using System.Linq.Expressions;

namespace Seeme.Domain.Extensions;

public static class QueryableExtensions
{
    public static IQueryable<T> ApplySort<T>(this IQueryable<T> source, string? orderBy)
    {
        if (source == null)
        {
            throw new ArgumentNullException(nameof(source));
        }

        // Mặc định sort theo ID nếu có ID
        var idProp = typeof(T).GetProperties().FirstOrDefault(x => x.Name.ToLower().Equals("id"));
        if (idProp != null)
        {
            orderBy =
                orderBy
                + (string.IsNullOrWhiteSpace(orderBy) ? string.Empty : ", ")
                + idProp.Name
                + " desc";
        }

        if (string.IsNullOrWhiteSpace(orderBy))
        {
            return source;
        }

        var orderByString = string.Empty;

        // the orderBy string is separated by ",", so we split it.
        var orderByAfterSplit = orderBy.Split(',');

        // apply each orderby clause
        foreach (var orderByClause in orderByAfterSplit)
        {
            // trim the orderBy clause, as it might contain leading
            // or trailing spaces. Can't trim the var in foreach,
            // so use another var.
            var trimmedOrderByClause = orderByClause.Trim().ToLower();

            // if the sort option ends with with " desc", we order
            // descending, ortherwise ascending
            var orderDescending = trimmedOrderByClause.EndsWith(" desc");

            // remove " asc" or " desc" from the orderBy clause, so we
            // get the property name to look for in the mapping dictionary
            var indexOfFirstSpace = trimmedOrderByClause.IndexOf(" ");
            var propertyName =
                indexOfFirstSpace == -1
                    ? trimmedOrderByClause
                    : trimmedOrderByClause.Remove(indexOfFirstSpace);

            // find the matching property
            var property = typeof(T)
                .GetProperties()
                .FirstOrDefault(x => x.Name.ToLower().Equals(propertyName));

            if (property is null)
            {
                throw new ArgumentException($"Key mapping for {propertyName} is missing");
            }

            orderByString =
                orderByString
                + (string.IsNullOrWhiteSpace(orderByString) ? string.Empty : ", ")
                + property.Name
                + (orderDescending ? " descending" : " ascending");
        }

        return source.OrderBy(orderByString);
    }

    public static Expression<Func<T, bool>> BuildSearchExpression<T>(string keyword)
    {
        if (string.IsNullOrWhiteSpace(keyword))
            return x => true; // không có từ khóa thì không filter

        var parameter = Expression.Parameter(typeof(T), "x");
        Expression? combined = null;

        foreach (
            var prop in typeof(T)
                .GetProperties()
                .Where(p =>
                    p.IsDefined(typeof(SearchableAttribute), true)
                    && p.PropertyType == typeof(string)
                )
        )
        {
            var property = Expression.Property(parameter, prop);
            var constant = Expression.Constant(keyword);

            var containsMethod = typeof(string).GetMethod(
                nameof(string.Contains),
                new[] { typeof(string) }
            );
            var contains = Expression.Call(property, containsMethod!, constant);

            combined = combined == null ? contains : Expression.OrElse(combined, contains);
        }

        return combined != null ? Expression.Lambda<Func<T, bool>>(combined, parameter) : x => true;
    }

    public static Expression<Func<T, bool>> AndAlso<T>(
        this Expression<Func<T, bool>> expr1,
        Expression<Func<T, bool>> expr2
    )
    {
        var parameter = Expression.Parameter(typeof(T));

        var leftVisitor = new ReplaceParameterVisitor(expr1.Parameters[0], parameter);
        var left = leftVisitor.Visit(expr1.Body);

        var rightVisitor = new ReplaceParameterVisitor(expr2.Parameters[0], parameter);
        var right = rightVisitor.Visit(expr2.Body);

        var body = Expression.AndAlso(left!, right!);
        return Expression.Lambda<Func<T, bool>>(body, parameter);
    }

    private class ReplaceParameterVisitor : ExpressionVisitor
    {
        private readonly ParameterExpression _oldParam;
        private readonly ParameterExpression _newParam;

        public ReplaceParameterVisitor(ParameterExpression oldParam, ParameterExpression newParam)
        {
            _oldParam = oldParam;
            _newParam = newParam;
        }

        protected override Expression VisitParameter(ParameterExpression node) =>
            node == _oldParam ? _newParam : base.VisitParameter(node);
    }
}
