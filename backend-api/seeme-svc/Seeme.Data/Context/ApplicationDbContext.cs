using Seeme.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Seeme.Data.Context;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<UserAddress> UserAddress { get; set; }
    public DbSet<Tea> Teas { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderTea> OrderTeas { get; set; }
    public DbSet<OrderProduct> OrderProducts { get; set; }
    public DbSet<Garden> Gardens { get; set; }
    public DbSet<CategoryTea> CategoryTeas { get; set; }
    public DbSet<TeaGroup> TeaGroups { get; set; }
    public DbSet<PlantProgress> PlantProgress { get; set; }
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Contact> Contacts { get; set; }
    public DbSet<UserTracking> UserTrackings { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        // Configuration for User entity
        modelBuilder.Entity<User>(builder =>
        {
            builder.ToTable("Users");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.IsDelete)
                .HasDefaultValue(false);
        });

        // Configuration for RefreshToken entity
        modelBuilder.Entity<RefreshToken>(builder =>
        {
            builder.ToTable("RefreshTokens");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Token)
                .IsRequired()
                .HasMaxLength(100);
        });

        // Configuration for PasswordResetToken entity
        modelBuilder.Entity<PasswordResetToken>(builder =>
        {
            builder.ToTable("PasswordResetTokens");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.OtpCode)
                .IsRequired()
                .HasMaxLength(10);

            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(256);
        });

        modelBuilder.Entity<Tea>()
        .Property(t => t.Lat)
        .HasPrecision(9, 6); // total digits, decimal places

        modelBuilder.Entity<Tea>()
        .Property(t => t.Long)
        .HasPrecision(9, 6); // total digits, decimal places

        // Configuration for TeaGroup entity
        modelBuilder.Entity<TeaGroup>(builder =>
        {
            builder.ToTable("TeaGroups");

            builder.HasKey(x => x.Id);

            // Slug là khóa nghiệp vụ, unique, khớp CategoryTea.Group (không khóa ngoại để dữ liệu cũ không gãy)
            builder.HasIndex(x => x.Slug).IsUnique();

            builder.Property(x => x.Slug)
                .IsRequired()
                .HasMaxLength(100);
        });
    }
}
