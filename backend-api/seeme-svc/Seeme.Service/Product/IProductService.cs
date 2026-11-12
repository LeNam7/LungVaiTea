using Seeme.Domain.Entities;
using Seeme.Domain.Models;
using Seeme.Domain.Models.Product;
using Seeme.Domain.Models.ReponseModel;

namespace Seeme.Service.ProductService
{
    public interface IProductService
    {
        Task<Response<Product>> AddProductAsync(Product product);
        Task<Response<Product>> UpdateProductAsync(int id, Product product);
        Task<Response<bool>> DeleteProductAsync(int id);
        Task<Response<Product>> GetProductByIdAsync(int id);
        Task<Response<PagingDataModel<Product>>> GetProductsPagingAsync(PaginationParam param);
        Task<Response<List<Product>>> GetProductByCategoryIdAsync(int id);
        Task<Response<List<SoldCountModel>>> GetSoldCountsAsync();
    }
}
