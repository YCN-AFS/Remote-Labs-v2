# Hướng Dẫn Migration từ LowDB sang PostgreSQL

## Tổng Quan

Hệ thống đã được nâng cấp từ LowDB (JSON file-based database) sang PostgreSQL để cải thiện:
- Tính ổn định và độ tin cậy
- Hiệu suất với dữ liệu lớn
- Khả năng mở rộng
- Backup và recovery
- ACID properties

## Yêu Cầu

1. **PostgreSQL 12+** đã được cài đặt và chạy
2. **Node.js 18+**
3. **npm** hoặc **yarn**

## Cài Đặt Dependencies

```bash
cd remote-lab-backend
npm install
```

## Cấu Hình Database

1. Tạo database PostgreSQL:
```sql
CREATE DATABASE remote_labs;
```

2. Cập nhật file `.env` với thông tin database:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=remote_labs
```

## Chạy Migration

### 1. Tạo Database Schema
```bash
npm run migrate
```

### 2. Migrate Dữ Liệu từ LowDB
```bash
npm run migrate:data
```

### 3. Backup Database (Tùy chọn)
```bash
npm run backup
```

## Cấu Trúc Database Mới

### Bảng `users`
- `id` (string, primary key)
- `username` (string, unique)
- `email` (string, unique)
- `password` (string, hashed)
- `role` (string, default: 'user')
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Bảng `students`
- `id` (string, primary key)
- `email` (string, unique)
- `full_name` (string)
- `phone` (string)
- `course_id` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Bảng `payments`
- `id` (string, primary key)
- `order_code` (string, unique)
- `email` (string)
- `full_name` (string)
- `phone` (string)
- `course_id` (string)
- `amount` (decimal)
- `status` (string, default: 'pending')
- `payment_method` (string)
- `payos_response` (json)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Bảng `computers`
- `id` (string, primary key)
- `name` (string)
- `ip_address` (string)
- `nat_port_winrm` (integer)
- `nat_port_rdp` (integer)
- `status` (string, default: 'available')
- `description` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Bảng `schedules`
- `id` (string, primary key)
- `email` (string)
- `user_name` (string)
- `password` (string)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `status` (string, default: 'pending')
- `computer_id` (string, foreign key)
- `notes` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Tính Năng Mới

### 1. Connection Pooling
- Tự động quản lý kết nối database
- Tối ưu hiệu suất với nhiều request đồng thời

### 2. Error Handling
- Xử lý lỗi database tốt hơn
- Retry mechanism cho kết nối

### 3. Backup & Recovery
- Script backup tự động
- Metadata backup
- Cleanup old backups

### 4. Data Validation
- Kiểm tra dữ liệu trước khi lưu
- Constraint validation

## Rollback (Nếu Cần)

Nếu cần quay lại LowDB:

1. Backup dữ liệu PostgreSQL:
```bash
npm run backup
```

2. Khôi phục file LowDB từ backup cũ

3. Cập nhật code để sử dụng LowDB

## Monitoring

### Kiểm Tra Kết Nối Database
```bash
# Test connection
node -e "import('./config/database.js').then(db => db.testConnection())"
```

### Xem Logs
```bash
# Xem logs application
tail -f logs/app.log

# Xem logs database
tail -f logs/db.log
```

## Troubleshooting

### Lỗi Kết Nối Database
1. Kiểm tra PostgreSQL đang chạy
2. Kiểm tra thông tin kết nối trong `.env`
3. Kiểm tra firewall và network

### Lỗi Migration
1. Kiểm tra quyền database user
2. Kiểm tra database đã tồn tại
3. Xem logs chi tiết

### Lỗi Dữ Liệu
1. Kiểm tra format dữ liệu cũ
2. Chạy lại migration data
3. Kiểm tra constraints

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs
2. Xem troubleshooting guide
3. Liên hệ team phát triển
