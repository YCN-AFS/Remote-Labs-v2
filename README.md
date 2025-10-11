# Remote Labs v2

Hệ thống Remote Lab cho phép học viên đăng ký khóa học, thanh toán và đặt lịch thực hành trên máy tính từ xa.

## 🚀 Cấu trúc dự án

```
Remote-Labs-v2/
├── remote-lab-backend/          # Backend API (Node.js/Express)
├── remote-lab-landing/          # Frontend (Nuxt.js/Vue.js)
├── start-production.sh          # Script khởi động production
├── stop-production.sh           # Script dừng production
└── README.md                    # File hướng dẫn này
```

## 🔧 Cài đặt

### Yêu cầu hệ thống
- Node.js >= 18.x
- npm hoặc yarn
- Linux/Windows server

### Cài đặt dependencies

```bash
# Backend
cd remote-lab-backend
npm install

# Frontend  
cd ../remote-lab-landing
npm install
```

## 🚀 Chạy dự án

### Development Mode

```bash
# Terminal 1 - Backend
cd remote-lab-backend
npm run dev

# Terminal 2 - Frontend
cd remote-lab-landing
npm run dev
```

### Production Mode

```bash
# Khởi động production
./start-production.sh

# Dừng production
./stop-production.sh
```

## 🌐 URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Production
- **Frontend**: http://103.218.122.188:8080
- **Backend API**: http://103.218.122.188:8000

## 📋 Tính năng chính

### Cho học viên
- ✅ Đăng ký khóa học
- ✅ Thanh toán qua PayOS
- ✅ Đặt lịch thực hành
- ✅ Kết nối Remote Desktop
- ✅ Xem lịch sử thực hành

### Cho quản trị viên
- ✅ Quản lý lịch thực hành
- ✅ Quản lý máy tính
- ✅ Duyệt đăng ký
- ✅ Thông báo real-time (SSE)

## 🔧 Cấu hình

### Backend (.env)
```env
PORT=8000
JWT_SECRET=your_secret
PAYOS_CLIENT_ID=your_payos_id
PAYOS_API_KEY=your_payos_key
PAYOS_CHECKSUM_KEY=your_checksum_key
DOMAIN=https://your-domain.com
# ... các cấu hình khác
```

### Frontend (config/api.js)
```javascript
// Tự động detect environment
// Development: localhost
// Production: 103.218.122.188
```

## 🐛 Sửa lỗi đã thực hiện

### ✅ CORS Issues
- Cấu hình CORS cho phép frontend truy cập
- Hỗ trợ multiple origins (localhost + production IP)

### ✅ Hardcoded URLs
- Tạo file config/api.js để quản lý URLs
- Thay thế tất cả hardcoded URLs bằng config
- Tự động detect environment (dev/prod)

### ✅ API Endpoints
- Sửa tất cả API calls để sử dụng config
- Đảm bảo consistency giữa frontend và backend

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Payment
- `POST /api/payment` - Tạo thanh toán
- `GET /api/payment/complete` - Callback PayOS
- `GET /api/payment/:orderCode` - Kiểm tra trạng thái

### Schedule
- `GET /api/schedule` - Lấy danh sách lịch (Admin)
- `GET /api/schedule/:email` - Lấy lịch theo email
- `POST /api/schedule` - Đăng ký lịch mới
- `POST /api/schedule/:id/approve` - Duyệt lịch (Admin)

### Computer
- `GET /api/computer` - Lấy danh sách máy tính
- `POST /api/computer` - Thêm máy tính mới
- `PUT /api/computer/:id` - Cập nhật máy tính
- `DELETE /api/computer/:id` - Xóa máy tính

### SSE
- `GET /sse` - Server-Sent Events cho thông báo real-time

## 🔒 Bảo mật

- JWT Authentication
- CORS protection
- Input validation
- Error handling

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Cả hai servers đang chạy
2. CORS configuration
3. Environment variables
4. Network connectivity

## 📝 Changelog

### v2.0.0
- ✅ Sửa CORS issues
- ✅ Loại bỏ hardcoded URLs
- ✅ Cải thiện error handling
- ✅ Production-ready build