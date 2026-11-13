# syntax=docker/dockerfile:1
# =============================================================
#  Lùng Vài Trà - Backend (.NET 8 Web API)
#  Stages:
#    build   : restore + publish Release
#    migrate : image chạy `dotnet ef database update` (dùng qua docker compose --profile tools)
#    final   : image runtime gọn nhẹ để chạy API
# =============================================================

# ---------- Build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy riêng các file project trước để tận dụng cache của bước restore
COPY ["Seeme.sln", "./"]
COPY ["Seeme.API/Seeme.API.csproj", "Seeme.API/"]
COPY ["Seeme.Data/Seeme.Data.csproj", "Seeme.Data/"]
COPY ["Seeme.Domain/Seeme.Domain.csproj", "Seeme.Domain/"]
COPY ["Seeme.Service/Seeme.Service.csproj", "Seeme.Service/"]
RUN dotnet restore "Seeme.sln"

COPY . .
RUN dotnet publish "Seeme.API/Seeme.API.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- Migrate (EF Core tools) ----------
FROM build AS migrate
RUN dotnet tool install --global dotnet-ef --version 9.0.9
ENV PATH="$PATH:/root/.dotnet/tools"
WORKDIR /src
# Chuỗi kết nối lấy từ biến môi trường ConnectionStrings__DefaultConnection
ENTRYPOINT ["sh", "-c", "dotnet ef database update --project Seeme.Data --startup-project Seeme.API --configuration Release --connection \"$ConnectionStrings__DefaultConnection\""]

# ---------- Runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=5274 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_PRINT_TELEMETRY_MESSAGE=false
EXPOSE 5274

COPY --from=build /app/publish .
RUN mkdir -p /app/wwwroot/uploads

# Chạy bằng root để giữ đường dẫn khóa DataProtection mặc định (/root/.aspnet/DataProtection-Keys),
# thư mục này được mount volume trong docker-compose.yml.
ENTRYPOINT ["dotnet", "Seeme.API.dll"]
