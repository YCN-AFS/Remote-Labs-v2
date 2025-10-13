# 🔐 Hướng dẫn 2 loại tài khoản trong Remote Labs v2

## 📋 Tổng quan

Hệ thống Remote Labs v2 có **2 loại tài khoản** với chức năng và quyền truy cập khác nhau:

### 👨‍💼 **Tài khoản Admin**
- **Mục đích**: Quản lý hệ thống, xem báo cáo, quản lý học viên
- **Đăng nhập tại**: [http://103.218.122.188:8080/dashboard](http://103.218.122.188:8080/dashboard)
- **Thông tin đăng nhập**:
  - **Email**: `admin@example.com`
  - **Password**: `admin123`
  - **Role**: `admin`

### 👨‍🎓 **Tài khoản Học viên**
- **Mục đích**: Đăng ký lịch thực hành, sử dụng Remote Lab
- **Đăng nhập tại**: [http://103.218.122.188:8080/login](http://103.218.122.188:8080/login)
- **Thông tin đăng nhập** (tự động tạo sau thanh toán):
  - **Email**: `ycn.foxcode@gmail.com`
  - **Password**: `123456`
  - **Role**: `student`

## 🎯 Chức năng của từng loại tài khoản

### 👨‍💼 **Admin Dashboard** (`/dashboard`)
- ✅ **Quản lý học viên**: Xem, thêm, sửa, xóa học viên
- ✅ **Quản lý lịch thực hành**: Phê duyệt, hủy lịch
- ✅ **Quản lý máy tính**: Thêm, sửa, xóa máy tính
- ✅ **Xem báo cáo thanh toán**: Thống kê doanh thu
- ✅ **Quản lý hệ thống**: Cấu hình, backup

### 👨‍🎓 **Student Portal** (`/login`)
- ✅ **Đăng ký lịch thực hành**: Chọn thời gian và máy tính
- ✅ **Xem lịch đã đăng ký**: Theo dõi trạng thái
- ✅ **Thanh toán khóa học**: Mua khóa học
- ✅ **Sử dụng Remote Lab**: Kết nối máy tính ảo

## 🔧 Cách tạo tài khoản

### 👨‍💼 **Tạo tài khoản Admin**
```bash
# Chạy script tạo admin
cd /home/foxcode/Remote-Labs-v2/remote-lab-backend
node scripts/create-admin.js
```

### 👨‍🎓 **Tạo tài khoản Học viên**
Tài khoản học viên được **tự động tạo** khi:
1. **Thanh toán thành công** khóa học
2. **Đăng ký lịch thực hành** lần đầu
3. **Admin tạo thủ công** qua API

## 🚀 Hướng dẫn sử dụng

### **Bước 1: Đăng nhập Admin**
1. Truy cập [http://103.218.122.188:8080/dashboard](http://103.218.122.188:8080/dashboard)
2. Nhập thông tin:
   - Email: `admin@example.com`
   - Password: `admin123`
3. Truy cập các chức năng quản lý

### **Bước 2: Đăng nhập Học viên**
1. Truy cập [http://103.218.122.188:8080/login](http://103.218.122.188:8080/login)
2. Nhập thông tin:
   - Email: `ycn.foxcode@gmail.com`
   - Password: `123456`
3. Đăng ký lịch thực hành

## 📊 Database Schema

### **Bảng `users`** (Tài khoản đăng nhập)
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR UNIQUE,
    password VARCHAR,
    role VARCHAR DEFAULT 'student', -- 'admin' hoặc 'student'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Bảng `students`** (Thông tin học viên)
```sql
CREATE TABLE students (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    phone VARCHAR,
    course_id VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Bảo mật

### **Phân quyền theo Role**
- **Admin**: Truy cập tất cả API và chức năng
- **Student**: Chỉ truy cập API dành cho học viên

### **JWT Token**
- Mỗi tài khoản có token riêng với thông tin role
- Token hết hạn sau 1 ngày
- Tự động refresh khi cần thiết

## 🎉 Kết luận

Hệ thống Remote Labs v2 đã được thiết kế với **2 loại tài khoản rõ ràng**:

- ✅ **Admin**: Quản lý toàn bộ hệ thống
- ✅ **Student**: Sử dụng dịch vụ Remote Lab
- ✅ **Bảo mật**: Phân quyền theo role
- ✅ **Tự động hóa**: Tạo tài khoản học viên tự động

**Hệ thống sẵn sàng sử dụng với cả 2 loại tài khoản!** 🚀

