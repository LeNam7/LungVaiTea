using Seeme.Data.Repositories;
using Seeme.Domain.IRepositories;
using Seeme.Service.Auth;
using Seeme.Service.BlogService;
using Seeme.Service.Email;
using Seeme.Service.OrderService;
using Seeme.Service.PlantProcess;
using Seeme.Service.ProductService;
using Seeme.Service.Tracking;
using Seeme.Service.Tree;
using Seeme.Service.Upload;
using Seeme.Service.User;
using Seeme.Service.UserAddressService;

namespace Seeme.API.Extensions;

public static class DependencyInjectionExtension
{
    public static void AddDependencyInjection(this IServiceCollection services)
    {

        // Register Services
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IUploadService, UploadService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ITeaService, TeaService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IPlantProcessService, PlantProcessService>();
        services.AddScoped<IBlogService, BlogService>();
        services.AddScoped<IContactRepository, ContactRepository>();
        services.AddScoped<ITrackingService, TrackingService>();
        services.AddScoped<IUserAddressService, UserAddressService>();

        // Register Repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserAddressRepository, UserAddressRepository>();
        services.AddScoped<ICategoryTeaRepository, CategoryTeaRepository>();
        services.AddScoped<ITeaGroupRepository, TeaGroupRepository>();
        services.AddScoped<IGardenRepository, GardenRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderProductRepository, OrderProductRepository>();
        services.AddScoped<IOrderTeaRepository, OrderTeaRepository>();
        services.AddScoped<ITeaRepository, TeaRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IPlantProgressRepository, PlantProgressRepository>();
        services.AddScoped<IBlogRepository, BlogRepository>();
        services.AddScoped<IUserTrackingRepository, UserTrackingRepository>();
        services.AddScoped<IUserAddressRepository, UserAddressRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
        services.AddScoped<IEmailSender, EmailSender>();
    }
}
