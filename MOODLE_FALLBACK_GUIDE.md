# 🔧 Hướng dẫn xử lý khi Moodle không hoạt động

## 📋 Tổng quan

Khi Moodle LMS không hoạt động hoặc token không hợp lệ, hệ thống Remote Labs v2 đã được cập nhật để có thể hoạt động **mà không cần Moodle**.

## 🎯 Các giải pháp có sẵn

### 1. **Chế độ Bypass (Khuyến nghị)**
- Hệ thống sẽ bỏ qua việc kiểm tra Moodle
- Vẫn cho phép đăng ký lịch thực hành
- Hiển thị cảnh báo trong log nhưng không dừng hoạt động

### 2. **Tắt hoàn toàn Moodle Integration**
- Sử dụng biến môi trường `MOODLE_DISABLED=true`
- Hoàn toàn bỏ qua tất cả các API calls đến Moodle

## 🚀 Cách sử dụng

### Sử dụng Script tự động:
```bash
# Kiểm tra trạng thái hiện tại
./toggle-moodle.sh status

# Tắt Moodle integration
./toggle-moodle.sh disable

# Bật Moodle integration
./toggle-moodle.sh enable
```

### Sử dụng thủ công:
```bash
# Tắt Moodle
export MOODLE_DISABLED=true
cd remote-lab-backend
node index.js

# Bật Moodle (mặc định)
export MOODLE_DISABLED=false
cd remote-lab-backend
node index.js
```

## 📊 Trạng thái hiện tại

- ✅ **API `/api/schedule`**: Hoạt động bình thường (có fallback)
- ✅ **API `/api/course/enrol`**: Hoạt động với thông báo bypass
- ✅ **Các API khác**: Không bị ảnh hưởng

## ⚠️ Lưu ý quan trọng

1. **Khi Moodle bị tắt:**
   - Học viên có thể đăng ký lịch mà không cần có tài khoản Moodle
   - Việc đăng ký khóa học sẽ bỏ qua bước tạo tài khoản Moodle
   - Hệ thống vẫn hoạt động đầy đủ các chức năng cơ bản

2. **Khi Moodle hoạt động trở lại:**
   - Chạy `./toggle-moodle.sh enable` để bật lại
   - Restart server để áp dụng thay đổi
   - Hệ thống sẽ tự động kiểm tra Moodle trở lại

## 🔍 Kiểm tra log

Để theo dõi hoạt động của Moodle fallback, kiểm tra log server:
```bash
# Xem log realtime
tail -f /var/log/remote-labs.log

# Hoặc xem log trong terminal khi chạy server
```

## 🛠️ Troubleshooting

### Lỗi "Người dùng không tồn tại"
- **Nguyên nhân**: Moodle validation vẫn đang hoạt động
- **Giải pháp**: Chạy `./toggle-moodle.sh disable` và restart server

### API vẫn trả về lỗi 500
- **Nguyên nhân**: Server chưa được restart sau khi thay đổi
- **Giải pháp**: Restart server với `./stop-production.sh && ./start-production.sh`

### Muốn bật lại Moodle
- **Bước 1**: Cập nhật `LMS_TOKEN` hợp lệ
- **Bước 2**: Chạy `./toggle-moodle.sh enable`
- **Bước 3**: Restart server

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. Log server để xem thông báo lỗi chi tiết
2. Trạng thái Moodle integration với `./toggle-moodle.sh status`
3. Kết nối đến Moodle với `node test-moodle-connection.js`
