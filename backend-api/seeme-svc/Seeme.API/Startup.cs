using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Seeme.API.Extensions;
using Seeme.Data.Context;
using Seeme.Data.Repositories;
using Seeme.Domain.IRepositories;
using Seeme.Domain.Models.Auth;
using Seeme.Domain.Models.User;
using System.Net.Http.Headers;
using System.Reflection;
using System.Text;

namespace Seeme.API
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // connection sql
            services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                Configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            // Configure JWT
            var jwtSettings = Configuration.GetSection("JwtSettings").Get<JwtSettings>()
                ?? throw new InvalidOperationException("Thiếu cấu hình JwtSettings.");
            if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || Encoding.UTF8.GetByteCount(jwtSettings.SecretKey) < 32)
            {
                throw new InvalidOperationException(
                    "JwtSettings:SecretKey chưa được đặt hoặc ngắn hơn 32 byte. Đặt biến môi trường JwtSettings__SecretKey trong .env (openssl rand -base64 48).");
            }
            services.Configure<JwtSettings>(Configuration.GetSection("JwtSettings"));

            // Configure Email
            services.Configure<EmailSettings>(Configuration.GetSection("EmailSettings"));

            // Configure User
            services.Configure<UserSettings>(Configuration.GetSection("UserSettings"));

            // register web api controller
            services.AddControllers();

            // Authentication
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings.SecretKey)
                    ),
                    ClockSkew = TimeSpan.Zero,
                };
            });
            services.AddAuthorization();
            services.AddHttpContextAccessor();
            services.AddDependencyInjection();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Seeme.Service.Api", Description = "Seeme Service API", Version = "v1" });

                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                c.IncludeXmlComments(xmlPath);

                c.AddSecurityDefinition(name: JwtBearerDefaults.AuthenticationScheme, securityScheme: new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Description = "Enter the Bearer Authorization string as following: `Bearer Generated-JWT-Token`",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type= ReferenceType.SecurityScheme,
                                Id=JwtBearerDefaults.AuthenticationScheme
                            }
                        },
                        new string[] { }
                    }
                });
            });

            services.AddCors(p => p.AddPolicy("MasterKey", builder =>
            {
                builder.WithOrigins("*").AllowAnyMethod().AllowAnyHeader();
            }));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
            }

            app.UseStaticFiles();

            // Swagger chi bat o moi truong dev: tren production no cong khai
            // toan bo so do API cho nguoi la.
            if (env.IsDevelopment())
            {
                app.UseSwagger();

                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SEEME.Service.Api v1");
                    c.RoutePrefix = "SEEME";
                });
            }

            app.UseCors(builder => builder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader());

            app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}