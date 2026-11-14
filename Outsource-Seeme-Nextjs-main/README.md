# Lung Vai Tea - Frontend Website

Frontend website chính thức của thương hiệu **Lùng Vài Trà** (Trà Shan Tuyết cổ thụ Tây Côn Lĩnh, Hà Giang).

---

## 🛠️ Công nghệ sử dụng
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Giao diện**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Quản lý trạng thái**: [Redux Toolkit](https://redux-toolkit.js.org/) & React Redux
- **Ngôn ngữ**: TypeScript 5
- **Bản đồ số**: [React Map4D Map](https://map4d.vn/) & Google Maps
- **Soạn thảo CMS**: Tiptap Rich Text Editor
- **Tích hợp thanh toán**: VietQR tự động & SePay Webhook

---

## 📂 Cấu trúc Repository
```
LungVaiTea-Frontend/
├── src/
│   ├── app/                      # App Router pages, layouts, API routes
│   │   ├── (client)/             # Trang người dùng (Trang chủ, Giỏ hàng, Sản phẩm, Cây trà...)
│   │   ├── (auth)/               # Đăng nhập, Đăng ký, Quên mật khẩu
│   │   ├── cms/                  # Hệ thống quản trị nội dung CMS Admin
│   │   └── api/                  # Next.js API Routes (SePay socket, webhook...)
│   ├── components/               # UI components tái sử dụng
│   ├── constants/                # Hằng số thương hiệu, dữ liệu 63 tỉnh thành
│   ├── redux/                    # Redux Toolkit store, slices
│   └── utils/                    # Helper functions, axios API client
├── public/                       # Static assets (images, icons, fonts)
├── Dockerfile                    # Docker containerization (Standalone)
├── docker-compose.yml            # Deploy 1 lệnh trên server
├── .env.docker.example           # Mẫu biến môi trường cho Docker Compose
├── run-dev.bat                   # Chạy nhanh môi trường Development
├── build-prod.bat                # Biên dịch Production
└── run-prod.bat                  # Chạy nhanh môi trường Production
```

---

## ⚙️ Cấu hình biến môi trường (`.env`)

Tạo file `.env.local` (cho dev) hoặc `.env.production` (cho production):

```env
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_PATH=localhost
NEXT_PUBLIC_API_URL=http://localhost:5274
NEXT_PUBLIC_STORAGE_URL=http://localhost:5274
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Khóa bản đồ Map4D (hiển thị bản đồ cây trà)
NEXT_PUBLIC_MAP4D_ACCESS_KEY=
NEXT_PUBLIC_MAP4D_VERSION=2.3

# Bản đồ Google Maps (tùy chọn)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Số điện thoại admin quản trị CMS (mặc định: 0123456789)
NEXT_PUBLIC_CMS_ADMIN_PHONE=0123456789

# SePay Webhook Secret (xác thực webhook ngân hàng)
SEPAY_WEBHOOK_SECRET=
```

> [!IMPORTANT]
> Biến `NEXT_PUBLIC_*` được đóng gói trực tiếp vào file JavaScript tại thời điểm chạy lệnh `npm run build`. Khi chuyển sang domain backend chính thức (ví dụ: `https://api.lungvaitra.vn`), cần cập nhật giá trị `NEXT_PUBLIC_API_URL` và build lại.

---

## 💻 Hướng dẫn Chạy Local

### 1. Cài đặt thư viện (Dependencies)
```bash
npm install
# hoặc: yarn install
```

### 2. Chế độ Development (Hot Reload & Fast Refresh)
- **Cách 1**: Nhấp đúp file `run-dev.bat`.
- **Cách 2**: Dùng lệnh Terminal:
  ```bash
  npm run dev
  ```
- Truy cập website tại: [http://localhost:3000](http://localhost:3000)

### 3. Chế độ Production (Tối ưu hóa tốc độ tải)
- **Cách 1**: Nhấp đúp file `run-prod.bat`.
- **Cách 2**: Dùng lệnh Terminal:
  ```bash
  npm run build
  npm start
  ```

---

## 🚀 HƯỚNG DẪN DEPLOY PRODUCTION

### Cách 1: Triển khai trên Vercel (Khuyên dùng nhất cho Next.js)

1. Đẩy code lên GitHub (`https://github.com/LeNam7/LungVaiTea-Frontend`).
2. Đăng nhập vào [Vercel](https://vercel.com/) và chọn **Add New Project** -> Chọn repo `LungVaiTea-Frontend`.
3. Trong mục **Environment Variables**, cấu hình các biến:
   - `NEXT_PUBLIC_API_URL`: URL Backend API (ví dụ: `https://api.lungvaitra.vn`)
   - `NEXT_PUBLIC_STORAGE_URL`: URL Backend API (ví dụ: `https://api.lungvaitra.vn`)
   - `NEXT_PUBLIC_ENV`: `production`
   - `NEXT_PUBLIC_MAP4D_ACCESS_KEY`: Key Map4D
4. Nhấn **Deploy**. Vercel sẽ tự động build và cấp phát domain HTTPS toàn cầu.

---

### Cách 2: Triển khai trên Linux VPS (Nginx + PM2)

#### Bước 1: Cài đặt Node.js và PM2 trên VPS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

#### Bước 2: Clone source code và build
```bash
git clone https://github.com/LeNam7/LungVaiTea-Frontend.git /var/www/lungvaitra-frontend
cd /var/www/lungvaitra-frontend
npm install
npm run build
```

#### Bước 3: Quản lý tiến trình bằng PM2
```bash
pm2 start npm --name "lungvaitra-fe" -- start -- -p 3000
pm2 save
pm2 startup
```

#### Bước 4: Cấu hình Nginx Reverse Proxy & SSL (HTTPS)
Tạo file cấu hình `/etc/nginx/sites-available/lungvaitra.vn`:
```nginx
server {
    listen 80;
    server_name lungvaitra.vn www.lungvaitra.vn;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```
Kích hoạt cấu hình và cấp SSL miễn phí Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/lungvaitra.vn /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d lungvaitra.vn -d www.lungvaitra.vn
```

---

### Cách 3: Triển khai bằng Docker Compose (Khuyên dùng cho VPS)

#### Bước 1: Chuẩn bị file cấu hình
```bash
git clone https://github.com/LeNam7/LungVaiTea-Frontend.git /var/www/lungvaitra-frontend
cd /var/www/lungvaitra-frontend
cp .env.docker.example .env
nano .env          # điền NEXT_PUBLIC_API_URL, MAP4D key, SEPAY secret...
```

#### Bước 2: Build & chạy
```bash
docker compose up -d --build
```
Website chạy tại `http://<IP-server>:3000`.

#### Các lệnh thường dùng
```bash
docker compose logs -f              # Xem log realtime
docker compose ps                   # Trạng thái + healthcheck
docker compose restart              # Khởi động lại
docker compose down                 # Dừng và xóa container
docker compose up -d --build        # Deploy phiên bản mới (sau khi git pull)
```

> [!IMPORTANT]
> Các biến `NEXT_PUBLIC_*` được **nhúng cứng vào file JS lúc build**. Mỗi lần sửa chúng trong `.env` phải chạy lại `docker compose up -d --build`, chỉ `restart` sẽ **không** có tác dụng.
> Riêng `SEPAY_WEBHOOK_SECRET` và `TZ` là biến runtime — sửa xong chỉ cần `docker compose up -d`.

#### Dùng kèm Nginx + SSL trên host
Đặt trong `.env`:
```env
APP_BIND=127.0.0.1
APP_PORT=3000
```
Container khi đó chỉ nghe nội bộ, không lộ ra Internet. Sau đó cấu hình Nginx reverse proxy + Certbot như hướng dẫn ở **Cách 2 – Bước 4**.

#### Chỉ dùng Docker thuần (không Compose)
```bash
docker build -t lungvaitra-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://api.lungvaitra.vn \
  --build-arg NEXT_PUBLIC_SITE_URL=https://lungvaitra.vn .

docker run -d --name lungvai-frontend -p 3000:3000 --restart always \
  lungvaitra-frontend:latest
```

---

### Cách 4: Chế độ Standalone siêu nhẹ (Không cần node_modules gốc)

Dự án đã được kích hoạt `output: "standalone"` trong `next.config.ts`:
```bash
npm run build

# Copy tài nguyên tĩnh vào standalone:
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# Chạy bản siêu nhẹ (chỉ tốn vài chục MB RAM):
cd .next/standalone
PORT=3000 node server.js
```
