# Lung Vai Tea - Backend Web API

Backend API chính thức của hệ thống website **Lùng Vài Trà** (Trà Shan Tuyết cổ thụ Tây Côn Lĩnh, Hà Giang).

---

## 🛠️ Công nghệ sử dụng
- **Ngôn ngữ & Framework**: C# .NET 8 / ASP.NET Core Web API
- **Kiến trúc**: Clean Architecture (API, Service, Domain, Data)
- **Cơ sở dữ liệu**: Microsoft SQL Server
- **ORM**: Entity Framework Core 8 / 9
- **Authentication**: JWT (JSON Web Tokens)
- **Tài liệu API**: Swagger UI (OpenAPI)
- **Tích hợp**: Upload file ảnh/video, Email SMTP Gmail, SePay Webhook đối soát chuyển khoản

---

## 📂 Cấu trúc Repository
```
LungVaiTea-Backend/
├── Seeme.sln                     # Visual Studio Solution
├── Seeme.API/                    # Controllers, Startup, Program, appsettings.json
│   └── publish/                  # Thư mục xuất bản Production
├── Seeme.Data/                   # DbContext, Migrations, Repositories
├── Seeme.Domain/                 # Entities, DTO Models, Enums
├── Seeme.Service/                # Business Logic Services
├── Dockerfile                    # Docker containerization
├── run-dev.bat                   # Chạy nhanh môi trường Development
├── build-prod.bat                # Biên dịch Release & Publish
└── run-prod.bat                  # Chạy nhanh môi trường Production
```

---

## ⚙️ Cấu hình môi trường (`.env`)

`Seeme.API/appsettings.json` chỉ chứa cấu hình **không bí mật**. Mọi key/mật khẩu đặt trong file `.env` ở thư mục gốc repo (đã nằm trong `.gitignore`):

```bash
cp .env.example .env && chmod 600 .env   # rồi điền giá trị thật
```

| Biến | Ý nghĩa |
| --- | --- |
| `JwtSettings__SecretKey` | **Bắt buộc**, ≥ 32 ký tự (`openssl rand -base64 48`). Thiếu thì API không khởi động. |
| `EmailSettings__UserName` / `__Password` / `__FromAddress` / `__FromName` | Tài khoản Gmail SMTP (dùng App Password, không dùng mật khẩu Gmail). |
| `UserSettings__DefaultPassword` | Mật khẩu mặc định khi admin tạo user mới. |
| `MSSQL_SA_PASSWORD`, `DB_NAME`, ... | Dùng cho docker compose (xem `DEPLOY.md`). |

Biến dạng `Section__Key` ghi đè giá trị tương ứng trong `appsettings.json`. Khi chạy local bằng `dotnet run`, ứng dụng tự nạp `.env` (không ghi đè biến môi trường đã có sẵn); với docker compose thì `.env` được đưa vào qua `env_file`. Khi deploy bằng systemd/IIS, đặt các biến này trong `Environment=`/`EnvironmentFile=` hoặc biến môi trường của app pool.

---

## 💻 Hướng dẫn Chạy Local

### 1. Chế độ Development (Hot Reload & Debug)
- **Cách 1**: Nhấp đúp file `run-dev.bat`.
- **Cách 2**: Dùng lệnh Terminal:
  ```bash
  cd Seeme.API
  dotnet run --urls "http://localhost:5274"
  ```
- Truy cập Swagger UI tại: [http://localhost:5274/SEEME](http://localhost:5274/SEEME)

### 2. Chế độ Production (Release tối ưu)
- **Cách 1**: Nhấp đúp file `run-prod.bat` (tự động build nếu chưa có bản publish).
- **Cách 2**: Dùng lệnh Terminal:
  ```bash
  cd Seeme.API
  dotnet publish -c Release -o publish
  cd publish
  $env:ASPNETCORE_ENVIRONMENT="Production"
  .\Seeme.API.exe --urls "http://0.0.0.0:5274"
  ```

---

## 🚀 HƯỚNG DẪN DEPLOY PRODUCTION

### Cách 1: Triển khai trên Linux VPS (Ubuntu / Debian)

#### Bước 1: Cài đặt .NET 8 Runtime trên VPS
```bash
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0 aspnetcore-runtime-8.0
```

#### Bước 2: Đẩy thư mục `publish` lên máy chủ
```bash
# Ví dụ đẩy vào /var/www/lungvaitra-backend
scp -r ./Seeme.API/publish/* user@your-server-ip:/var/www/lungvaitra-backend/
```

#### Bước 3: Tạo dịch vụ Systemd tự khởi động
Tạo file `/etc/systemd/system/lungvaitra-backend.service`:
```ini
[Unit]
Description=Lung Vai Tea .NET 8 Web API
After=network.target

[Service]
WorkingDirectory=/var/www/lungvaitra-backend
ExecStart=/usr/bin/dotnet /var/www/lungvaitra-backend/Seeme.API.dll --urls "http://127.0.0.1:5274"
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=lungvaitra-backend
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
# File chứa JwtSettings__SecretKey, EmailSettings__*, UserSettings__*, ConnectionStrings__DefaultConnection (chmod 600)
EnvironmentFile=/etc/lungvaitra-backend.env

[Install]
WantedBy=multi-user.target
```

Kích hoạt và chạy dịch vụ:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lungvaitra-backend
sudo systemctl status lungvaitra-backend
```

#### Bước 4: Cấu hình Nginx Reverse Proxy & SSL (HTTPS)
Tạo file cấu hình Nginx `/etc/nginx/sites-available/api.lungvaitra.vn`:
```nginx
server {
    listen 80;
    server_name api.lungvaitra.vn;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5274;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```
Kích hoạt site và cấp chứng chỉ SSL miễn phí Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/api.lungvaitra.vn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.lungvaitra.vn
```

---

### Cách 2: Triển khai bằng Docker Compose (khuyến nghị)

Chạy cả **Backend + SQL Server** bằng `docker-compose.yml`. Hướng dẫn đầy đủ (deploy lần đầu, cập nhật, migrations, backup/restore, xử lý sự cố) nằm trong **[DEPLOY.md](DEPLOY.md)**.

```bash
cp .env.example .env && chmod 600 .env   # sửa mật khẩu / secret
docker compose up -d mssql
docker compose --profile tools run --rm migrate
docker compose up -d --build backend
```

---

### Cách 3: Triển khai trên Windows Server (IIS)
1. Cài đặt **ASP.NET Core Hosting Bundle 8.0** trên Windows Server.
2. Mở IIS Manager, tạo Website mới trỏ vào thư mục `publish`.
3. Đảm bảo Application Pool được đặt ở chế độ `No Managed Code`.
4. Cấp quyền Write cho `IIS_IUSRS` vào thư mục `wwwroot/uploads`.
