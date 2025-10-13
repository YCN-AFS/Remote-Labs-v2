# 🎓 Hệ thống quản lý học viên độc lập (Không cần Moodle)

## 📋 Tổng quan

Hệ thống Remote Labs v2 đã được nâng cấp với **hệ thống quản lý học viên hoàn toàn độc lập**, không phụ thuộc vào Moodle LMS. Điều này đảm bảo hệ thống có thể hoạt động ngay cả khi Moodle gặp sự cố.

## 🎯 Tính năng chính

### ✅ **Quản lý học viên tự động**
- **Tự động tạo học viên** khi đăng ký lịch thực hành
- **Lưu trữ thông tin** trong PostgreSQL database
- **Tạo tài khoản đăng nhập** tự động cho học viên
- **Không cần kiểm tra Moodle** trước khi đăng ký

### ✅ **API quản lý học viên**
- `GET /api/students` - Lấy danh sách tất cả học viên
- `POST /api/students` - Tạo học viên mới
- `GET /api/students/search?q=keyword` - Tìm kiếm học viên
- `GET /api/students/stats` - Thống kê học viên
- `PUT /api/students/:id` - Cập nhật thông tin học viên
- `DELETE /api/students/:id` - Xóa học viên

## 🏗️ Kiến trúc hệ thống

### Database Schema
```sql
-- Bảng students
CREATE TABLE students (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    course_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bảng users (tài khoản đăng nhập)
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    password VARCHAR,
    role VARCHAR DEFAULT 'student',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### StudentManager Class
```javascript
// Các phương thức chính
- createStudent(studentData)     // Tạo học viên mới
- validateStudent(email)         // Kiểm tra học viên tồn tại
- getAllStudents()              // Lấy tất cả học viên
- searchStudents(query)         // Tìm kiếm học viên
- getStudentStats()             // Thống kê học viên
- updateStudent(id, data)       // Cập nhật thông tin
- deleteStudent(id)             // Xóa học viên
```

## 🚀 Cách sử dụng

### 1. **Tạo học viên mới**
```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "courseId": "course-001"
  }'
```

### 2. **Tìm kiếm học viên**
```bash
curl -X GET "http://localhost:8000/api/students/search?q=nguyen"
```

### 3. **Xem thống kê**
```bash
curl -X GET http://localhost:8000/api/students/stats
```

### 4. **Đăng ký lịch thực hành** (tự động tạo học viên)
```bash
curl -X POST http://localhost:8000/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newstudent@example.com",
    "startTime": "2024-12-25T10:00:00Z",
    "endTime": "2024-12-25T12:00:00Z"
  }'
```

## 📊 Kết quả test

### ✅ **API hoạt động thành công:**
- ✅ Tạo học viên: `POST /api/students`
- ✅ Lấy danh sách: `GET /api/students`
- ✅ Tìm kiếm: `GET /api/students/search`
- ✅ Thống kê: `GET /api/students/stats`

### 📝 **Ví dụ response:**
```json
{
  "status": "success",
  "message": "Học viên đã được tạo thành công",
  "data": {
    "student": {
      "id": "4QK7m3dSPnzxRhM0NPvjn",
      "email": "test.student@example.com",
      "full_name": "Test Student",
      "phone": "0123456789",
      "course_id": "course-001",
      "created_at": "2025-10-12T23:58:10.824Z",
      "updated_at": "2025-10-12T23:58:10.824Z"
    },
    "credentials": {
      "username": "test.student",
      "email": "test.student@example.com",
      "password": "123456"
    }
  }
}
```

## 🔧 Cấu hình

### Biến môi trường
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=remote_labs

# Moodle (tùy chọn)
MOODLE_DISABLED=true  # Tắt hoàn toàn Moodle
LMS_TOKEN=your_token
LMS_BASE_URL=https://lms.example.com
```

### Mật khẩu mặc định
- **Username**: Phần trước @ của email
- **Password**: `123456` (có thể thay đổi trong code)

## 🎯 Lợi ích

### ✅ **Độc lập hoàn toàn**
- Không phụ thuộc vào Moodle
- Hoạt động ngay cả khi LMS gặp sự cố
- Tự động tạo học viên khi cần

### ✅ **Quản lý dễ dàng**
- API đầy đủ cho CRUD operations
- Tìm kiếm và thống kê
- Tích hợp với hệ thống đăng ký lịch

### ✅ **Bảo mật**
- Mật khẩu được hash bằng bcrypt
- Tài khoản riêng cho mỗi học viên
- Phân quyền rõ ràng

## 🔄 Migration từ Moodle

### Bước 1: Export dữ liệu từ Moodle
```bash
# Sử dụng Moodle API để export danh sách học viên
curl -X POST "https://lms.example.com/webservice/rest/server.php" \
  -d "wstoken=YOUR_TOKEN&wsfunction=core_user_get_users&moodlewsrestformat=json"
```

### Bước 2: Import vào hệ thống mới
```bash
# Sử dụng API để tạo học viên hàng loạt
for student in $(cat students.json | jq -r '.[] | @base64'); do
  data=$(echo $student | base64 -d)
  curl -X POST http://localhost:8000/api/students \
    -H "Content-Type: application/json" \
    -d "$data"
done
```

## 🛠️ Troubleshooting

### Lỗi "StudentManager is not a function"
- **Nguyên nhân**: StudentManager chưa được khởi tạo đúng
- **Giải pháp**: Restart server và kiểm tra log

### Lỗi "Email đã được sử dụng"
- **Nguyên nhân**: Email đã tồn tại trong database
- **Giải pháp**: Sử dụng email khác hoặc cập nhật thông tin

### Lỗi "Lịch đăng ký đã đầy"
- **Nguyên nhân**: Không liên quan đến học viên, do lịch trùng
- **Giải pháp**: Chọn thời gian khác

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log server: `tail -f /var/log/remote-labs.log`
2. Test API: `curl -X GET http://localhost:8000/api/students`
3. Kiểm tra database: `psql -d remote_labs -c "SELECT * FROM students;"`

## 🎉 Kết luận

Hệ thống quản lý học viên mới đã **hoàn toàn thay thế** sự phụ thuộc vào Moodle, đảm bảo:
- ✅ **Tính độc lập**: Hoạt động không cần Moodle
- ✅ **Tính tự động**: Tự tạo học viên khi cần
- ✅ **Tính linh hoạt**: API đầy đủ cho mọi tác vụ
- ✅ **Tính ổn định**: Không bị ảnh hưởng bởi sự cố Moodle
