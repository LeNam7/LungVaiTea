# Lung Vai Tea (Lùng Vài Trà)

Dự án website chính thức của **Lùng Vài Trà** - Thương hiệu trà Shan Tuyết cổ thụ Tây Côn Lĩnh, Hà Giang.

## Cấu trúc dự án

- **`backend-api/`**: Backend API viết bằng .NET 8 / ASP.NET Core Web API (Seeme API & Services, Entity Framework Core, SQL Server).
- **`Outsource-Seeme-Nextjs-main/`**: Frontend Website viết bằng Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion, Redux Toolkit, Map4D.

## Hướng dẫn cài đặt & khởi chạy

### 1. Backend (.NET API)
```bash
cd backend-api/seeme-svc/Seeme.API
dotnet run --urls "http://localhost:5274"
```

### 2. Frontend (Next.js)
```bash
cd Outsource-Seeme-Nextjs-main
yarn install
yarn dev
```
Website chạy tại [http://localhost:3000](http://localhost:3000).
