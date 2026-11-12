# Lung Vai Tea (Lùng Vài Trà)

Dự án website chính thức của thương hiệu **Lùng Vài Trà** - Thương hiệu trà Shan Tuyết cổ thụ Tây Côn Lĩnh, Hà Giang.

---

## Cấu trúc dự án

- **`backend-api/`**: Backend API viết bằng **.NET 8 / ASP.NET Core Web API**, Entity Framework Core 8, SQL Server.
- **`Outsource-Seeme-Nextjs-main/`**: Frontend Website viết bằng **Next.js 16 (Turbopack, App Router)**, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Redux Toolkit, Map4D.

---

## 🚀 Hướng dẫn Build & Chạy Production (Product)

> [!TIP]
> Xem tài liệu chi tiết chuyên sâu tại [BUILD_PRODUCTION.md](file:///d:/Projects/LungVaiTea/BUILD_PRODUCTION.md).

### Cách 1: Sử dụng Script tự động (1-Click trên Windows)

1. **Build toàn bộ dự án:**
   Chạy file [build-production.bat](file:///d:/Projects/LungVaiTea/build-production.bat) bằng cách nhấp đúp hoặc chạy trong cmd:
   ```cmd
   build-production.bat
   ```
2. **Khởi chạy môi trường Production:**
   Chạy file [start-production.bat](file:///d:/Projects/LungVaiTea/start-production.bat):
   ```cmd
   start-production.bat
   ```
   - **Frontend Web**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs**: [http://localhost:5274/SEEME](http://localhost:5274/SEEME)

---

### Cách 2: Thao tác thủ công bằng lệnh (Command Line)

#### 1. Build & Chạy Backend (.NET 8 API)
```bash
# 1. Di chuyển vào thư mục API và publish bản Release
cd backend-api/seeme-svc/Seeme.API
dotnet publish -c Release -o publish

# 2. Đảm bảo thư mục lưu ảnh upload tồn tại
mkdir publish\wwwroot\uploads

# 3. Khởi chạy Backend Production
cd publish
# Windows PowerShell:
$env:ASPNETCORE_ENVIRONMENT="Production"
.\Seeme.API.exe --urls "http://0.0.0.0:5274"

# Hoặc trên Linux/macOS/Windows qua dotnet:
ASPNETCORE_ENVIRONMENT=Production dotnet Seeme.API.dll --urls "http://0.0.0.0:5274"
```

#### 2. Build & Chạy Frontend (Next.js 16)
```bash
# 1. Di chuyển vào thư mục Frontend
cd Outsource-Seeme-Nextjs-main

# 2. Kiểm tra/cấu hình biến môi trường tại .env.production (hoặc .env.local)
# Đảm bảo NEXT_PUBLIC_API_URL=http://localhost:5274 (hoặc URL API thực tế)

# 3. Cài đặt thư viện (nếu chưa cài) và build tối ưu Production
npm run build

# 4. Khởi chạy máy chủ Production
npm start
```

---

## 🛠️ Hướng dẫn Khởi chạy Môi trường Phát triển (Development)

Dành cho lập trình viên cần tính năng Hot-Reload và Debug:

### 1. Backend Dev
```bash
cd backend-api/seeme-svc/Seeme.API
dotnet run --urls "http://localhost:5274"
```

### 2. Frontend Dev
```bash
cd Outsource-Seeme-Nextjs-main
npm run dev
# hoặc: yarn dev
```

---

## 📋 Thông tin cổng & Kiểm tra dịch vụ

| Dịch vụ | Cổng (Port) | Đường dẫn kiểm tra | Mô tả |
| :--- | :--- | :--- | :--- |
| **Frontend Website** | `3000` | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng Lùng Vài Trà |
| **Backend API Swagger** | `5274` | [http://localhost:5274/SEEME](http://localhost:5274/SEEME) | Tài liệu kiểm thử API tương tác |
| **Cơ sở dữ liệu** | `1433` (SQL Express) | `localhost\SQLEXPRESS` | Database `seeme-web` |
