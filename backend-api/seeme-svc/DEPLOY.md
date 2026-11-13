# Deploy bằng Docker Compose

Hướng dẫn deploy **Backend API + SQL Server** lên Linux VPS bằng Docker Compose.

| Thành phần | Container | Cổng | Dữ liệu lưu ở (volume) |
|---|---|---|---|
| SQL Server 2022 Express | `lungvai-mssql` | `127.0.0.1:1433` (chỉ trong server) | `lungvai-mssql-data` |
| Backend .NET 8 API | `lungvai-backend` | `5274` | `lungvai-uploads` (ảnh upload), `lungvai-dpkeys` (khóa DataProtection) |
| EF migrations (chạy khi cần) | `migrate` (profile `tools`) | – | – |

Các file liên quan: `Dockerfile`, `docker-compose.yml`, `.env.example`.

---

## Yêu cầu

- Docker Engine 24+ và plugin Docker Compose v2 (`docker compose version`)
- RAM tối thiểu **2 GB trống** cho SQL Server (server 4 GB RAM thì giữ `MSSQL_MEMORY_LIMIT_MB=1024`)
- User deploy nằm trong group `docker`

---

## 1. Deploy lần đầu

```bash
git clone https://github.com/LeNam7/LungVaiTea-Backend.git
cd LungVaiTea-Backend

# Tạo file cấu hình bí mật
cp .env.example .env
chmod 600 .env
nano .env        # đổi MSSQL_SA_PASSWORD, JwtSettings__SecretKey, EmailSettings__*, UserSettings__DefaultPassword
```

Khởi động SQL Server và đợi trạng thái `healthy`:

```bash
docker compose up -d mssql
docker compose ps          # cột STATUS phải là "healthy"
```

Tạo database và các bảng (EF Core migrations):

```bash
docker compose --profile tools run --rm migrate
```

Build và chạy backend:

```bash
docker compose up -d --build backend
docker compose logs -f backend      # thấy "Application started" là OK
```

Kiểm tra API:

```bash
curl -X POST http://127.0.0.1:5274/api/product/paging \
  -H "Content-Type: application/json" -d '{"pageIndex":1,"pageSize":5}'
# -> {"data":{...},"statusCode":200,"message":"Success"}
```

> Swagger UI: `http://<server>:5274/SEEME`

---

## 2. Deploy phiên bản mới

```bash
cd ~/LungVaiTea-Backend
git pull

# Nếu lần cập nhật này có migration mới (thư mục Seeme.Data/Migrations thay đổi):
docker compose --profile tools run --rm --build migrate

docker compose up -d --build backend
docker image prune -f          # dọn image cũ
```

Lệnh `migrate` chạy lại nhiều lần vẫn an toàn: EF chỉ áp các migration chưa có trong bảng `__EFMigrationsHistory`.

---

## 3. Lệnh thường dùng

| Việc | Lệnh |
|---|---|
| Xem trạng thái | `docker compose ps` |
| Xem log backend | `docker compose logs -f --tail 100 backend` |
| Restart backend | `docker compose restart backend` |
| Dừng tất cả (giữ dữ liệu) | `docker compose down` |
| Mở SQL shell | `docker compose exec mssql bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d seeme-web'` |

> ⚠️ **Không** dùng `docker compose down -v`: lệnh này xóa volume, tức là **mất toàn bộ database và ảnh upload**.

---

## 4. Backup và restore database

**Backup** (tạo file `.bak` rồi copy ra thư mục `~/lungvai-backups`):

```bash
mkdir -p ~/lungvai-backups
F=seeme-web-$(date +%Y%m%d-%H%M%S).bak
docker compose exec mssql bash -c "mkdir -p /var/opt/mssql/backup && /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P \"\$MSSQL_SA_PASSWORD\" -C -b \
  -Q \"BACKUP DATABASE [seeme-web] TO DISK='/var/opt/mssql/backup/$F' WITH COMPRESSION, INIT\""
docker cp lungvai-mssql:/var/opt/mssql/backup/$F ~/lungvai-backups/
```

Có thể đưa đoạn trên vào `crontab -e` để backup hằng ngày.

**Restore** từ file `.bak` (sẽ ghi đè database hiện tại):

```bash
docker cp ~/lungvai-backups/<file>.bak lungvai-mssql:/var/opt/mssql/backup/restore.bak
docker compose stop backend
docker compose exec mssql bash -c '/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b \
  -Q "RESTORE DATABASE [seeme-web] FROM DISK=N'"'"'/var/opt/mssql/backup/restore.bak'"'"' WITH REPLACE"'
docker compose start backend
```

Backup ảnh upload:

```bash
docker run --rm -v lungvai-uploads:/data -v ~/lungvai-backups:/backup alpine \
  tar czf /backup/uploads-$(date +%Y%m%d).tar.gz -C /data .
```

---

## 5. Kết nối DB từ máy dev (SSMS / Azure Data Studio / DBeaver)

SQL Server chỉ mở trên `127.0.0.1` của server, nên cần đi qua SSH tunnel:

```bash
ssh -N -L 14330:127.0.0.1:1433 <user>@<server-ip> -p <ssh-port>
```

Sau đó kết nối tới `localhost,14330`, user `sa`, mật khẩu lấy từ `.env`, bật *Trust server certificate*.

---

## 6. Nginx + HTTPS (khuyến nghị)

1. Trong `.env` đặt `BACKEND_BIND=127.0.0.1`, rồi chạy `docker compose up -d backend`.
2. Tạo site nginx proxy tới `http://127.0.0.1:5274` (mẫu cấu hình có trong `README.md`, mục *Nginx Reverse Proxy*), sau đó cấp SSL bằng `certbot --nginx`.

---

## 7. Chuyển server đang chạy bằng `docker run` sang Compose

Server hiện tại đã có sẵn các container `lungvai-mssql`, `lungvai-backend` cùng volume và network, được tạo thủ công. File compose dùng **đúng các tên volume/network đó**, nên dữ liệu được giữ lại:

```bash
cd ~/LungVaiTea-Backend && git pull
cp .env.example .env && chmod 600 .env
# Đặt MSSQL_SA_PASSWORD trong .env = mật khẩu đang dùng (xem ~/lungvai-infra/.env)
docker rm -f lungvai-backend lungvai-mssql      # chỉ xóa container, volume vẫn còn
docker compose up -d --build
```

Docker có thể cảnh báo *"volume already exists but was not created by Docker Compose"*. Cảnh báo này vô hại, volume cũ vẫn được dùng bình thường.

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| API trả 500, log có `Error Locating Server/Instance Specified` | Backend không lấy được connection string. Kiểm tra `docker compose config` và biến `MSSQL_SA_PASSWORD` trong `.env`. |
| `lungvai-mssql` liên tục restart | Thiếu RAM (cần ≥ 2 GB) hoặc mật khẩu SA quá yếu. Xem `docker compose logs mssql`. |
| `Login failed for user 'sa'` | Mật khẩu trong `.env` khác mật khẩu lúc tạo volume. SQL Server chỉ đọc `MSSQL_SA_PASSWORD` ở **lần khởi tạo đầu tiên**; về sau phải đổi mật khẩu bằng `ALTER LOGIN sa WITH PASSWORD=...`. |
| `Invalid object name 'Products'` | Chưa chạy migrations: `docker compose --profile tools run --rm migrate`. |
