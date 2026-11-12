# HƯỚNG DẪN BUILD VÀ VẬN HÀNH PRODUCTION (LÙNG VÀI TRÀ)

Tài liệu hướng dẫn chi tiết quy trình **Build**, **Cấu hình** và **Khởi chạy môi trường Production (Product)** cho toàn bộ hệ thống website **Lùng Vài Trà** (bao gồm Backend .NET 8 Web API và Frontend Next.js 16).

---

## 1. Kiến trúc hệ thống & Yêu cầu môi trường

### Cấu trúc dự án
- **Backend**: `backend-api/seeme-svc/Seeme.API`
  - Nền tảng: .NET 8 / ASP.NET Core Web API, Entity Framework Core 8, Swagger UI.
  - Cơ sở dữ liệu: Microsoft SQL Server (`seeme-web`).
  - Cổng mặc định: `5274` (URL: `http://localhost:5274`, Swagger: `http://localhost:5274/SEEME`).
- **Frontend**: `Outsource-Seeme-Nextjs-main`
  - Nền tảng: Next.js 16 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Redux Toolkit, Map4D.
  - Cổng mặc định: `3000` (URL: `http://localhost:3000`).

### Yêu cầu cài đặt trên máy chủ (Prerequisites)
1. **.NET 8 SDK / ASP.NET Core Runtime 8.0**: [Tải tại đây](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Node.js (LTS v20+ hoặc v24+)**: [Tải tại đây](https://nodejs.org/)
3. **Microsoft SQL Server (2019/2022 hoặc SQL Express)** đang hoạt động.

---

## 2. Khởi chạy nhanh bằng Script (1-Click)

Dự án đã được tích hợp sẵn 2 script tự động hóa:

### Bước 1: Build toàn bộ dự án
Chạy file [build-production.bat](file:///d:/Projects/LungVaiTea/build-production.bat):
```cmd
build-production.bat
```
*Script sẽ tự động biên dịch Backend sang chế độ Release, xuất ra thư mục `publish`, tạo thư mục upload tĩnh và thực hiện `npm run build` tối ưu hóa cho Frontend Next.js.*

### Bước 2: Khởi chạy môi trường Production
Chạy file [start-production.bat](file:///d:/Projects/LungVaiTea/start-production.bat):
```cmd
start-production.bat
```
*Script sẽ tự động khởi chạy đồng thời Backend (.NET Production) và Frontend (Next.js Production) trong 2 cửa sổ độc lập.*

---

## 3. Hướng dẫn Build & Chạy thủ công (Command Line)

### Phân hệ 1: Backend (.NET 8 Web API)

#### 1. Biên dịch & Publish bản Release:
Mở terminal và di chuyển vào thư mục API:
```bash
cd backend-api/seeme-svc/Seeme.API
dotnet publish -c Release -o publish
```
> [!NOTE]
> Kết quả build sẽ nằm tại thư mục `backend-api/seeme-svc/Seeme.API/publish`.

#### 2. Đảm bảo thư mục upload tĩnh tồn tại:
```powershell
if (!(Test-Path "publish\wwwroot\uploads")) { New-Item -ItemType Directory -Path "publish\wwwroot\uploads" -Force }
```

#### 3. Chạy Backend ở chế độ Production:
**Trên Windows (PowerShell):**
```powershell
cd backend-api/seeme-svc/Seeme.API/publish
$env:ASPNETCORE_ENVIRONMENT="Production"
.\Seeme.API.exe --urls "http://0.0.0.0:5274"
```

**Hoặc chạy qua dotnet runtime (Windows / Linux):**
```bash
cd backend-api/seeme-svc/Seeme.API/publish
ASPNETCORE_ENVIRONMENT=Production dotnet Seeme.API.dll --urls "http://0.0.0.0:5274"
```

---

### Phân hệ 2: Frontend (Next.js 16)

#### 1. Chuẩn bị file môi trường (`.env.production`):
Trong thư mục `Outsource-Seeme-Nextjs-main`, kiểm tra file `.env.production` (hoặc tạo file `.env.production.local` nếu muốn ghi đè riêng cho từng máy chủ):
```env
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_PATH=localhost
NEXT_PUBLIC_API_URL=http://localhost:5274
NEXT_PUBLIC_STORAGE_URL=http://localhost:5274
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Khóa bản đồ (Map4D / Google Maps)
NEXT_PUBLIC_MAP4D_ACCESS_KEY=your_map4d_key_here
NEXT_PUBLIC_MAP4D_VERSION=2.3
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Quản trị viên CMS (Số điện thoại được phép đăng nhập CMS)
NEXT_PUBLIC_CMS_ADMIN_PHONE=0123456789

# Thanh toán SePay Webhook (tùy chọn)
SEPAY_WEBHOOK_SECRET=
```
> [!IMPORTANT]
> Biến `NEXT_PUBLIC_*` sẽ được đóng gói (bake) trực tiếp vào bundle JavaScript tại thời điểm chạy lệnh `build`. Nếu bạn thay đổi URL API production thực tế (ví dụ: `https://api.lungvaitra.vn`), cần cập nhật lại giá trị này và thực hiện build lại.

#### 2. Biên dịch Production Build:
```bash
cd Outsource-Seeme-Nextjs-main
npm run build
# hoặc: npx yarn build
```

#### 3. Khởi chạy Frontend Production:

##### Cách A: Khởi chạy trực tiếp (Tiêu chuẩn)
```bash
cd Outsource-Seeme-Nextjs-main
npm start
# Server sẽ lắng nghe tại: http://localhost:3000
```

##### Cách B: Chạy bản độc lập tối ưu (Standalone Mode)
Dự án đã được bật cấu hình `output: "standalone"` trong `next.config.ts`. Bản này tối ưu hóa dung lượng máy chủ VPS / Docker (không cần giữ thư mục `node_modules` gốc nặng hàng trăm MB):
```bash
cd Outsource-Seeme-Nextjs-main

# Copy thư mục tĩnh vào standalone (chỉ cần làm 1 lần sau khi build)
xcopy /E /I /Y public .next\standalone\public
xcopy /E /I /Y .next\static .next\standalone\.next\static

# Khởi chạy bằng Node.js:
cd .next\standalone
set PORT=3000
node server.js
```

---

## 4. Cấu hình Production chi tiết

### 1. Chuỗi kết nối Database (`appsettings.json`)
Trong `backend-api/seeme-svc/Seeme.API/appsettings.json` (hoặc `publish/appsettings.json`):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=seeme-web;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;"
  },
  "JwtSettings": {
    "SecretKey": "your-256-bit-secret-key-here-minimum-32-characters",
    "Issuer": "seeme-management",
    "Audience": "seeme-users",
    "TokenExpirationInMinutes": 60,
    "RefreshTokenExpirationInDays": 7
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "EnableSsl": true,
    "UserName": "your-email@gmail.com",
    "Password": "your-app-password",
    "FromAddress": "your-email@gmail.com",
    "FromName": "Lung Vai Tea"
  }
}
```

---

## 5. Hướng dẫn triển khai Production trên máy chủ thực tế (Deploy)

### Triển khai trên Linux VPS (Ubuntu / Debian)

1. **Quản lý tiến trình Backend (.NET) bằng Systemd:**
Tạo file dịch vụ `/etc/systemd/system/lungvai-backend.service`:
```ini
[Unit]
Description=Lung Vai Tea .NET Web API
After=network.target

[Service]
WorkingDirectory=/var/www/lungvaitra/backend
ExecStart=/usr/bin/dotnet /var/www/lungvaitra/backend/Seeme.API.dll --urls "http://127.0.0.1:5274"
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=lungvai-backend
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```
Kích hoạt service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lungvai-backend
```

2. **Quản lý tiến trình Frontend (Next.js) bằng PM2:**
```bash
cd /var/www/lungvaitra/frontend
pm2 start npm --name "lungvai-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

3. **Cấu hình Nginx Reverse Proxy (SSL HTTPS):**
```nginx
# Frontend
server {
    listen 80;
    server_name lungvaitra.vn www.lungvaitra.vn;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.lungvaitra.vn;

    location / {
        proxy_pass http://127.0.0.1:5274;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Kiểm tra & Giám sát hệ thống

| Phân hệ | Địa chỉ kiểm tra | Trạng thái mong đợi |
| :--- | :--- | :--- |
| **Frontend Web** | `http://localhost:3000` | Trang chủ Lùng Vài Trà hiển thị đầy đủ giao diện, hình ảnh, font chữ |
| **Backend Swagger** | `http://localhost:5274/SEEME` | Giao diện Swagger UI hiển thị danh sách các API controller |
| **Kiểm tra API Health**| `http://localhost:5274/api/product/paging` (POST) | Trả về JSON `{ "statusCode": 200, "message": "Success" }` |

---

## 7. Xử lý sự cố thường gặp (Troubleshooting)

1. **Lỗi `Address already in use` (Port 5274 hoặc 3000 bị chiếm):**
   - Kiểm tra tiến trình đang chiếm cổng:
     ```powershell
     Get-NetTCPConnection -LocalPort 5274, 3000 -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess
     ```
   - Tắt tiến trình cũ: `Stop-Process -Id <PID> -Force`

2. **Lỗi `The WebRootPath was not found` trong Backend:**
   - Tạo thư mục `publish/wwwroot/uploads` trước khi chạy `Seeme.API.exe`.

3. **Frontend không gọi được API Backend:**
   - Kiểm tra giá trị `NEXT_PUBLIC_API_URL` trong file `.env.production` hoặc `.env.local` có đúng `http://localhost:5274` (hoặc domain backend của bạn) không.
   - Nhớ build lại Frontend (`npm run build`) sau khi sửa biến `NEXT_PUBLIC_*`.
