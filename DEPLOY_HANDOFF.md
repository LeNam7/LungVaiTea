# TÀI LIỆU BÀN GIAO & HƯỚNG DẪN TRIỂN KHAI PRODUCTION (DEPLOY HANDOFF)
**Dự án:** Lùng Vài Trà (Lung Vai Tea)  
**Phiên bản:** Production v1.0.0 (Data Migration 14/11/2026)  
**Tác giả:** Đội ngũ phát triển hệ thống Lùng Vài Trà  

---

## 📌 1. TỔNG QUAN HỆ THỐNG ĐÃ HOÀN THIỆN

Hệ thống đã được đồng bộ 100% dữ liệu chính thức, loại bỏ toàn bộ dữ liệu mẫu (demo) và kiểm thử hoạt động trơn tru:
- **Cơ sở dữ liệu chính thức**: 110 sản phẩm trà (đủ các phân loại Lục Trà, Hồng Trà, Bạch Trà, Phổ Nhĩ và 48 sản phẩm Set Quà Tặng), 156 cây trà cổ thụ Lùng Vài với tọa độ GPS, 11 vườn trà, 16 bài viết cẩm nang văn hóa trà chính thức.
- **Hero Video Banner**: Tích hợp video phong cảnh Tây Côn Lĩnh (desktop & mobile) tự động phát lặp mượt mà.
- **Đa ngôn ngữ & Tiền tệ**: Hỗ trợ chuyển đổi Việt - Anh, thanh toán nội địa và cổng quốc tế (PayPal / Stripe).
- **Sửa lỗi nền tảng**: Đã xử lý triệt để lỗi server rendering `2980544602` và chuẩn hóa fallback ảnh.

---

## 🗄️ 2. BƯỚC 1: CẤU HÌNH CƠ SỞ DỮ LIỆU (DATABASE)

Cơ sở dữ liệu sử dụng **Microsoft SQL Server (2019/2022 hoặc SQL Express)** với tên database là `seeme-web`.

### Cách 1: Nạp tự động bằng script PowerShell (1-Click)
Mở PowerShell tại thư mục gốc dự án và chạy:
```powershell
.\import_official_data.ps1
```
*Script sẽ tự động dọn sạch các bảng cũ, nạp toàn bộ bản ghi từ `seeme-data.sql`, cập nhật bản dịch tiếng Anh và kiểm tra số lượng bản ghi.*

### Cách 2: Nạp thủ công bằng SQL Server Management Studio (SSMS) hoặc sqlcmd
1. Nếu chưa có database, chạy script [seeme-web.sql](file:///d:/Projects/LungVaiTea/seeme-web.sql) để tạo schema.
2. Nạp dữ liệu chính thức bằng lệnh `sqlcmd`:
   ```bash
   sqlcmd -S "localhost\SQLEXPRESS" -E -d "seeme-web" -b -i "seeme-data.sql"
   ```
3. Đảm bảo migration đa ngôn ngữ đã có trong bảng lịch sử:
   ```sql
   IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE MigrationId = '20261113085354_MultilingualFields20261113')
   BEGIN
       INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
       VALUES ('20261113085354_MultilingualFields20261113', '9.0.9');
   END
   ```

---

## 🌐 3. BƯỚC 2: CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT CONFIG)

### A. Backend Web API (.NET 8)
Tạo file `.env` tại thư mục `backend-api/seeme-svc/.env` (hoặc cấu hình Environment Variables trên máy chủ):
```env
# Tên Database
DB_NAME=seeme-web

# Cổng Backend lắng nghe
BACKEND_BIND=0.0.0.0
BACKEND_PORT=5274

# Khóa bí mật ký JWT Token (Bắt buộc, tối thiểu 32 ký tự)
JwtSettings__SecretKey=lungvaitra-super-secret-key-production-2026-very-secure-jwt-token-key-minimum-32-bytes!

# Mật khẩu mặc định tạo tài khoản nội bộ
UserSettings__DefaultPassword=LungVaiTea@2026!

# Chuỗi kết nối Database (nếu không dùng mặc định localhost\SQLEXPRESS)
# ConnectionStrings__DefaultConnection=Server=127.0.0.1;Database=seeme-web;User Id=sa;Password=YourStrongPassword;TrustServerCertificate=True;
```

### B. Frontend Website (Next.js 16)
Cấu hình file `Outsource-Seeme-Nextjs-main/.env.production`:
```env
NEXT_PUBLIC_ENV=production

# Đường dẫn URL API Backend của bạn (Đổi thành domain thực tế khi có domain)
NEXT_PUBLIC_API_URL=http://localhost:5274
# Hoặc khi chạy domain: NEXT_PUBLIC_API_URL=https://api.lungvaitea.vn

# Đường dẫn Storage hình ảnh
NEXT_PUBLIC_STORAGE_URL=https://api.seemevitraco.vn
# Hoặc nếu bạn tự host ảnh trên backend của mình: NEXT_PUBLIC_STORAGE_URL=http://localhost:5274

# Đường dẫn Website Frontend
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Hoặc khi chạy domain: NEXT_PUBLIC_SITE_URL=https://lungvaitea.vn

# Đường dẫn CDN tải Video Banner (Desktop & Mobile)
NEXT_PUBLIC_VIDEO_ASSET_BASE_URL=https://web.lungvaitea.vn/videos

# Cấu hình phụ trợ (Bản đồ & CMS)
NEXT_PUBLIC_MAP4D_ACCESS_KEY=
NEXT_PUBLIC_MAP4D_VERSION=2.3
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_CMS_ADMIN_PHONE=0123456789
NEXT_PUBLIC_USD_VND_EXCHANGE_RATE=25400
```

---

## 🎬 4. BƯỚC 3: QUẢN LÝ TÀI NGUYÊN MEDIA & VIDEO

### 1. Video Banner Trang chủ:
- Hai file video `home-banner-desktop-v7.mp4` (~35 MB) và `home-banner-mobile-v7.mp4` (~60 MB) đã được đưa vào `.gitignore` để không làm nặng source code.
- **Khi deploy:** Với cấu hình `NEXT_PUBLIC_VIDEO_ASSET_BASE_URL=https://web.lungvaitea.vn/videos`, frontend sẽ tự động stream trực tiếp từ CDN máy chủ gốc, bạn không cần phải copy 95 MB file video thủ công.

### 2. Thư mục ảnh Uploads (`wwwroot/uploads`):
- Toàn bộ 127 hình ảnh bài viết và sản phẩm thực tế đã được đồng bộ sẵn vào thư mục `backend-api/seeme-svc/Seeme.API/publish/wwwroot/uploads`.
- Nếu bạn muốn backend tự phục vụ ảnh hoàn toàn offline: Copy thư mục `uploads` này lên máy chủ.
- Nếu muốn tiết kiệm dung lượng máy chủ: Chỉ cần trỏ `NEXT_PUBLIC_STORAGE_URL=https://api.seemevitraco.vn` như cấu hình ở Bước 2.

---

## 🚀 5. BƯỚC 4: BUILD VÀ KHỞI CHẠY (DEPLOYMENT EXECUTION)

### Phương án A: Tự động hóa 1-Click trên Windows Server
1. **Build toàn bộ:** Nhấp đúp chạy file `build-production.bat`.
2. **Khởi chạy:** Nhấp đúp chạy file `start-production.bat`.

### Phương án B: Chạy thủ công hoặc trên Linux (Ubuntu Server / PM2 / Systemd)

#### 1. Build Backend API:
```bash
cd backend-api/seeme-svc/Seeme.API
dotnet publish -c Release -o publish
```

#### 2. Chạy Backend API:
```bash
cd backend-api/seeme-svc/Seeme.API/publish
ASPNETCORE_ENVIRONMENT=Production dotnet Seeme.API.dll --urls "http://0.0.0.0:5274"
```
*(Trên Linux, nên cấu hình chạy dưới dạng dịch vụ `systemd` hoặc supervisor).*

#### 3. Build & Chạy Frontend (Next.js 16):
```bash
cd Outsource-Seeme-Nextjs-main
npm run build
npm start
```
*(Trên server Linux, khuyến nghị quản lý bằng PM2: `pm2 start npm --name "lungvaitea-fe" -- start`).*

---

## ✅ 6. BẢNG KIỂM TRA CHẤT LƯỢNG SAU DEPLOY (VERIFICATION CHECKLIST)

| Hạng mục kiểm tra | URL kiểm tra | Kết quả mong đợi |
| :--- | :--- | :--- |
| **Trang chủ** | `/` | HTTP 200, Video Banner phong cảnh tự động phát lặp mượt mà. |
| **Tin tức trang chủ** | `/#tin-tuc` | Ảnh bìa bài viết cổ thụ và 4 bài viết lưới hiển thị sắc nét, không vỡ icon. |
| **Trang danh sách Tin tức** | `/tin-tuc` | Hiển thị bài viết nổi bật, khối xem nhiều và 10 bài viết phân trang `< 1 2 >`. |
| **Trang Sản phẩm trà** | `/san-pham-tra` | Đủ 110 sản phẩm theo các nhóm (Lục trà, Hồng trà, Bạch trà, Phổ nhĩ, Set quà tặng). |
| **Cây trà di sản** | `/bo-suu-tap-cay-tra` | Danh sách 156 cây cổ thụ (01206-A, 01078-A...) hiển thị tuổi, giá và bản đồ. |
| **Tài liệu API Swagger** | `http://localhost:5274/SEEME` | Giao diện Swagger tải đầy đủ các controller và endpoint hoạt động. |
| **Chuyển ngữ Anh - Việt** | Nút `VN / EN` trên header | Chuyển đổi ngôn ngữ trơn tru trên mọi trang. |

---
*Tài liệu này được tạo tự động nhằm đảm bảo toàn bộ quy trình bàn giao và triển khai đạt tiêu chuẩn cao nhất.*
