# Hệ thống Commands cho Remote Lab

## Tổng quan

Hệ thống commands cho phép server gửi lệnh đến các máy tính thực hành Windows thông qua API. Máy tính Windows sẽ polling server để lấy lệnh và thực thi.

## Cấu trúc Database

### Bảng `commands`
- `id`: ID duy nhất của lệnh
- `computer_id`: ID của máy tính (foreign key)
- `action`: Loại lệnh (create_user, enable_rdp, install_software, etc.)
- `parameters`: Tham số lệnh (JSON)
- `status`: Trạng thái (pending, executing, completed, failed)
- `result`: Kết quả thực thi
- `error`: Thông báo lỗi
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật
- `executed_at`: Thời gian bắt đầu thực thi
- `completed_at`: Thời gian hoàn thành

## API Endpoints

### 1. GET /api/commands
**Mô tả**: Lấy tất cả lệnh pending từ server
**Được gọi bởi**: Máy tính Windows
**Response**: Array các lệnh pending

### 2. POST /api/commands
**Mô tả**: Tạo lệnh mới
**Được gọi bởi**: Admin
**Body**:
```json
{
  "computer_id": "computer-id",
  "action": "create_user",
  "parameters": {
    "username": "testuser",
    "password": "testpass"
  }
}
```

### 3. GET /api/computer/:id/commands
**Mô tả**: Lấy lệnh cho máy tính cụ thể
**Được gọi bởi**: Máy tính Windows
**Response**:
```json
{
  "status": "success",
  "data": {
    "computerId": "computer-id",
    "commands": [...]
  }
}
```

### 4. POST /api/commands/status
**Mô tả**: Gửi trạng thái thực thi lệnh
**Được gọi bởi**: Máy tính Windows
**Body**:
```json
{
  "status": "completed",
  "message": "User created successfully",
  "computer": "computer-name",
  "commandId": "command-id",
  "result": "Success message"
}
```

### 5. GET /api/admin-credentials
**Mô tả**: Lấy thông tin đăng nhập admin
**Được gọi bởi**: Máy tính Windows
**Response**:
```json
{
  "username": "Admin",
  "password": "lhu@B304"
}
```

## Các loại lệnh được hỗ trợ

1. **create_user**: Tạo user mới
   - Parameters: `username`, `password`

2. **enable_rdp**: Bật Remote Desktop
   - Parameters: không có

3. **enable_powershell_remoting**: Bật PowerShell Remoting
   - Parameters: không có

4. **install_software**: Cài đặt phần mềm
   - Parameters: `software` (vscode, arduino, camera)

5. **extract_ssh_keys**: Giải nén SSH keys
   - Parameters: không có

6. **setup_ssh_tunnel**: Thiết lập SSH tunnel
   - Parameters: `username`, `password`

7. **custom_command**: Lệnh tùy chỉnh
   - Parameters: `command`

8. **register_computer**: Đăng ký máy tính với server
   - Parameters: không có

9. **create_admin_user**: Tạo user admin
   - Parameters: `username`, `password`

## Cách sử dụng

### 1. Chạy Migration
```bash
cd remote-lab-backend
node run-migration.js
```

### 2. Khởi động Server
```bash
npm start
```

### 3. Test hệ thống
```bash
node test-commands.js
```

### 4. Tạo lệnh từ Admin
```bash
curl -X POST http://localhost:8000/api/commands \
  -H "Content-Type: application/json" \
  -d '{
    "computer_id": "computer-id",
    "action": "create_user",
    "parameters": {
      "username": "testuser",
      "password": "testpass123"
    }
  }'
```

## Luồng hoạt động

1. **Admin tạo lệnh** → POST /api/commands
2. **Máy tính Windows polling** → GET /api/commands
3. **Server trả về lệnh pending** → Lệnh được đánh dấu "executing"
4. **Máy tính thực thi lệnh** → Script init.ps1
5. **Máy tính gửi kết quả** → POST /api/commands/status
6. **Server cập nhật trạng thái** → Lệnh được đánh dấu "completed" hoặc "failed"

## Cấu hình

Tạo file `.env` với nội dung:
```
# Admin Credentials
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=lhu@B304

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=remote_labs
```

## Lưu ý

- Máy tính Windows cần chạy script `init.ps1` ở chế độ background
- Script sẽ polling server mỗi 30 giây (có thể cấu hình)
- Lệnh cũ hơn 7 ngày sẽ được tự động xóa
- Tất cả endpoint commands không yêu cầu authentication
