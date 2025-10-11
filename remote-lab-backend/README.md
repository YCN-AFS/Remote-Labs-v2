# Hướng Dẫn README Cho Remote Lab API

Đây là tài liệu hướng dẫn cài đặt và sử dụng cho hệ thống Remote Lab API.

## Mục Lục

- [Giới thiệu](#giới-thiệu)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình môi trường (.env)](#cấu-hình-môi-trường-env)
- [Khởi động dự án](#khởi-động-dự-án)
- [Cấu trúc phản hồi API](#cấu-trúc-phản-hồi-api)
- [Authentication (JWT)](#authentication-jwt)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Các API chính](#các-api-chính)
    - [Health Check](#health-check)
    - [Authentication](#authentication)
    - [Thanh toán và tạo tài khoản](#thanh-toán-và-tạo-tài-khoản)
    - [Khóa học](#khóa-học)
    - [Đăng ký lịch thực hành](#đăng-ký-lịch-thực-hành)
    - [Quản lý lịch thực hành (Admin)](#quản-lý-lịch-thực-hành-admin)
    - [Quản lý máy tính (Admin)](#quản-lý-máy-tính-admin)

---

## Giới Thiệu

Remote Lab API là hệ thống hỗ trợ học viên đăng ký khoá học, thanh toán, đặt lịch thực hành và quản lý máy tính thực hành qua nền tảng RESTful API. Sử dụng ExpressJS, LowDB để lưu trữ dữ liệu, tích hợp PayOS cho thanh toán, liên kết với hệ thống Moodle LMS và quản lý phiên truy cập Remote Desktop qua SSH và Windows Remote Management.

## Yêu Cầu Hệ Thống

- Node.js >= 18.x
- PowerShell 7 (pwsh)
- Hệ điều hành Linux hoặc Windows (nơi cài API server)
- Đã cài đặt và cấu hình PayOS, Moodle và Email API phục vụ dự án.

## Cài Đặt

1.  **Clone mã nguồn**:
    ```sh
    git clone https://github.com/tr1nh/remote-lab-backend
    cd remote-lab-backend
    ```

2.  **Cài đặt các package cần thiết**:
    ```sh
    npm install
    ```

## Cấu Hình Môi Trường (`.env`)

Tạo file `.env` ở thư mục gốc, tham khảo các biến sau (ví dụ):

```dotenv
PORT=8000                                      # PORT của server
DOMAIN=https://demo.tr1nh.net                  # tên miền của server, PayOS gọi đến khi thanh toán thành công
                                              
PAYOS_CLIENT_ID=your_payos_client_id          
PAYOS_API_KEY=your_payos_api_key              
PAYOS_CHECKSUM_KEY=your_payos_checksum_key    
                                              
JWT_SECRET=thisisasecret                      
                                              
PROFILE_BASE_URL=https://profile.domain.com    # API xác thực user của T&A Lab
ADMIN_EMAIL=admin@domain.com                   # email admin dùng để nhận thông báo
MAIL_API=https://mail-api.domain.com/send      # API để gửi email, viết bằng Apps Script
                                              
LMS_BASE_URL=https://lms.domain.com            # LMS Moodle
LMS_TOKEN=your_moodle_token                    # token để gọi API Moodle
                                              
CREDENTIAL_PATH=credential.xml                 # dùng để xác thực khi kết nối đến các PC thực hành
COMPUTER_NAME=192.168.1.2                      
```

## Khởi Động Dự Án

```sh
npm run dev
```

## Cấu trúc phản hồi API

Tất cả các phản hồi thành công từ API sẽ theo định dạng JSON sau:

```json
{
  "status": "success",
  "message": "Mô tả ngắn gọn về kết quả",
  "data": {
    // Dữ liệu trả về (có thể là đối tượng, mảng, hoặc null)
  }
}
```

Các phản hồi lỗi sẽ theo định dạng:

```json
{
  "status": "error",
  "message": "Mô tả chi tiết về lỗi xảy ra"
}
```

## Authentication (JWT)

Một số API yêu cầu xác thực bằng JSON Web Token (JWT). Sau khi đăng nhập thành công, bạn sẽ nhận được một JWT. Token này phải được gửi trong header của mọi yêu cầu đã xác thực theo định dạng `Authorization: Bearer <token>`.

**Ví dụ:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Server-Sent Events (SSE)

Hệ thống cung cấp một endpoint Server-Sent Events để gửi các cập nhật theo thời gian thực đến client, đặc biệt là các thông báo liên quan đến lịch thực hành.

### `GET /sse`

*   **Mô tả**: Thiết lập kết nối SSE để nhận thông báo theo thời gian thực.
*   **Headers Phản hồi**:
    *   `Content-Type: text/event-stream`
    *   `Cache-Control: no-cache`
    *   `Connection: keep-alive`
*   **Dữ liệu sự kiện**: Các sự kiện được gửi dưới dạng chuỗi JSON, ví dụ:
    ```
    data: {"message":"Hello","type":"info"}
    ```
    Các loại sự kiện chính:
    *   `new-schedule`: Gửi khi có lịch thực hành mới được đăng ký.
        ```json
        {"type": "new-schedule", "message": "Có lịch thực hành mới"}
        ```
    *   `approved-schedule`: Gửi khi một lịch thực hành được quản trị viên duyệt.
        ```json
        {"type": "approved-schedule", "email": "user@example.com", "message": "Lịch thực hành đã được duyệt"}
        ```

---

## Các API Chính

### Health Check

Kiểm tra trạng thái hoạt động của API.

#### `GET /`

*   **Mô tả**: Trả về một thông báo đơn giản để xác nhận API đang chạy.
*   **Yêu cầu**: Không.
*   **Phản hồi thành công (200 OK)**:
    ```
    Hello World
    ```

### Authentication

Quản lý đăng nhập người dùng.

#### `POST /api/auth/login`

*   **Mô tả**: Đăng nhập người dùng bằng email và mật khẩu.
*   **Yêu cầu**:
    *   **Headers**: `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "email": "user@example.com",     // (String, Bắt buộc) Email người dùng
          "password": "password"           // (String, Bắt buộc) Mật khẩu người dùng
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "someid",
          "email": "user@example.com",
          "role": "admin" // hoặc "student"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // JWT Token
      }
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Thiếu email hoặc mật khẩu"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Email hoặc mật khẩu không đúng"
    }
    ```

### Thanh toán và tạo tài khoản

Các API liên quan đến quá trình thanh toán và tạo tài khoản học viên.

#### `POST /api/payment`

*   **Mô tả**: Khởi tạo quá trình thanh toán cho một khóa học.
*   **Yêu cầu**:
    *   **Headers**: `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "firstName": "Hoc",            // (String, Bắt buộc) Tên
          "lastName": "Vien",            // (String, Bắt buộc) Họ
          "email": "hocvien@example.com", // (String, Bắt buộc) Email
          "phone": "0987654321",          // (String, Bắt buộc) Số điện thoại
          "courseId": 12345               // (Number, Bắt buộc) ID khóa học trên Moodle
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã tạo mã thanh toán, quét mã để thanh toán",
      "data": {
        "code": "00",
        "desc": "Thành công",
        "qrCode": "data:image/png;base64,...", // QR code thanh toán
        "checkoutUrl": "https://pay.payos.vn/..." // Link tới trang thanh toán PayOS
      }
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Email hoặc số điện thoại đã tồn tại"
    }
    ```

#### `GET /api/payment/complete`

*   **Mô tả**: Endpoint callback của PayOS khi thanh toán thành công. API này sẽ xác thực trạng thái thanh toán, tạo tài khoản người dùng trên hệ thống Profile (hoặc gửi email thông báo nếu tài khoản đã tồn tại), và gửi email thông báo cho quản trị viên.
*   **Yêu cầu**:
    *   **Query Parameters**:
        *   `orderCode` (String, Bắt buộc): Mã đơn hàng được PayOS trả về.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã tạo tài khoản học viên thành công"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy thông tin thanh toán"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Chưa thanh toán thành công, vui lòng kiểm tra lại"
    }
    ```
*   **Lưu ý**: Endpoint này không được gọi trực tiếp bởi client mà do hệ thống PayOS gọi.

#### `GET /api/payment/cancel`

*   **Mô tả**: Endpoint callback của PayOS khi người dùng hủy thanh toán. Chuyển hướng về trang chủ.
*   **Yêu cầu**: Không.
*   **Phản hồi**: Chuyển hướng (302 Found) đến `/`.
*   **Lưu ý**: Endpoint này không được gọi trực tiếp bởi client mà do hệ thống PayOS gọi.

#### `GET /api/payment/:orderCode`

*   **Mô tả**: Lấy trạng thái thanh toán của một đơn hàng cụ thể từ PayOS.
*   **Yêu cầu**:
    *   **Path Parameters**:
        *   `orderCode` (String, Bắt buộc): Mã đơn hàng.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Kiểm tra trạng thái thanh toán",
      "data": {
        "orderCode": 123456,
        "status": "PAID", // Hoặc "PENDING", "CANCELLED"
        "amount": 100000,
        "paymentMethod": "QR_CODE",
        "paidAt": "2023-11-20T10:30:00Z",
        // ... các thông tin khác từ PayOS
      }
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy thông tin đơn hàng trên PayOS"
    }
    ```

### Khóa học

API liên quan đến quản lý khóa học.

#### `POST /api/course/enrol`

*   **Mô tả**: Ghi danh học viên vào khóa học trên hệ thống LMS (Moodle) sau khi đã thanh toán thành công.
*   **Yêu cầu**:
    *   **Headers**: `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "email": "hocvien@example.com" // (String, Bắt buộc) Email của học viên
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã thêm học viên vào khóa học"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy thông tin thanh toán"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Chưa thanh toán thành công"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Người dùng không tồn tại"
    }
    ```
    Hoặc lỗi từ Moodle LMS.

### Đăng ký lịch thực hành

Các API cho phép học viên đăng ký và xem lịch thực hành.

#### `GET /api/schedule/:email`

*   **Mô tả**: Lấy danh sách các lịch thực hành đã được duyệt của một học viên cụ thể.
*   **Yêu cầu**:
    *   **Path Parameters**:
        *   `email` (String, Bắt buộc): Email của học viên.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "sche_id_1",
          "email": "user@example.com",
          "userName": "user123",
          "startTime": "2023-11-20T14:00:00Z",
          "endTime": "2023-11-20T16:00:00Z",
          "status": "approved",
          "computerId": "comp_id_1",
          "natPortRdp": 3005,
          "password": "generatedpassword"
        },
        // ... các lịch khác
      ]
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Người dùng không tồn tại"
    }
    ```

#### `POST /api/schedule`

*   **Mô tả**: Học viên đăng ký một lịch thực hành mới. Lịch này sẽ ở trạng thái `pending` và chờ quản trị viên duyệt.
*   **Yêu cầu**:
    *   **Headers**: `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "email": "user@example.com",             // (String, Bắt buộc) Email của học viên
          "startTime": "2023-11-20T14:00:00Z",     // (ISO 8601 String, Bắt buộc) Thời gian bắt đầu
          "endTime": "2023-11-20T16:00:00Z"        // (ISO 8601 String, Bắt buộc) Thời gian kết thúc
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã đặt lịch thành công, đợi quản trị viên xác nhận"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Người dùng không tồn tại"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Thời gian thực hành ít nhất phải sau 1 phút từ hiện tại"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Lịch đăng ký đã đầy"
    }
    ```
*   **Lưu ý**: Sau khi đăng ký thành công, một email thông báo sẽ được gửi đến quản trị viên, và một sự kiện `new-schedule` sẽ được broadcast qua SSE.

### Quản lý lịch thực hành (Admin)

Các API này yêu cầu xác thực JWT và thường dành cho quản trị viên.

#### `GET /api/schedule`

*   **Mô tả**: Lấy toàn bộ danh sách các lịch thực hành đã được đăng ký (bao gồm cả `pending`, `approved`, `canceled`).
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "sche_id_1",
          "email": "user@example.com",
          "userName": "user123",
          "startTime": "2023-11-20T14:00:00Z",
          "endTime": "2023-11-20T16:00:00Z",
          "status": "pending", // hoặc "approved", "canceled"
          "computerId": null,
          "natPortRdp": null,
          "password": null
        },
        // ... các lịch khác
      ]
    }
    ```

#### `POST /api/schedule/:id/approve`

*   **Mô tả**: Quản trị viên duyệt một lịch thực hành đang chờ xử lý (`pending`). Hệ thống sẽ chỉ định một máy tính, tạo tài khoản người dùng remote, thiết lập SSH tunnel, và lên lịch các tác vụ tự động.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
    *   **Path Parameters**:
        *   `id` (String, Bắt buộc): ID của lịch thực hành cần duyệt.
    *   **Body**:
        ```json
        {
          "computerId": "comp_id_1" // (String, Bắt buộc) ID của máy tính sẽ được chỉ định
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã xác nhận lịch thực hành"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy lịch đăng ký"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Máy tính không tồn tại"
    }
    ```
    Hoặc
    ```json
    {
      "status": "error",
      "message": "Máy tính không sẵn sàng"
    }
    ```
*   **Lưu ý**:
    *   Hệ thống sẽ tạo ngẫu nhiên một `natPortRdp` mới nếu máy tính chưa có, và một mật khẩu cho phiên remote.
    *   Ba tác vụ được lên lịch tự động:
        1.  **Trước thời gian bắt đầu 1 phút**: Tạo tài khoản người dùng trên máy tính remote, thêm vào nhóm "Remote Desktop Users", và thiết lập SSH tunnel. Cập nhật trạng thái máy tính thành `busy`.
        2.  **Trước thời gian kết thúc 1 phút**: Gửi tin nhắn cảnh báo cho người dùng trên máy tính remote.
        3.  **Tại thời gian kết thúc**: Xóa tài khoản người dùng trên máy tính remote và khởi động lại máy tính. Cập nhật trạng thái máy tính thành `available`.
    *   Email thông tin đăng nhập Remote Desktop sẽ được gửi cho học viên và quản trị viên.
    *   Một sự kiện `approved-schedule` sẽ được broadcast qua SSE.

#### `GET /api/schedule/:id/cancel`

*   **Mô tả**: Quản trị viên hủy một lịch thực hành.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Path Parameters**:
        *   `id` (String, Bắt buộc): ID của lịch thực hành cần hủy.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã hủy lịch thực hành"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy lịch đăng ký"
    }
    ```
*   **Lưu ý**: Nếu có các tác vụ đã được lên lịch cho lịch này (tạo user, nhắc nhở, xóa user), chúng sẽ bị hủy. Email thông báo hủy sẽ được gửi cho học viên và quản trị viên.

### Quản lý máy tính (Admin)

Các API này yêu cầu xác thực JWT và dành cho quản trị viên để thêm, sửa, xóa máy tính vật lý trong hệ thống.

#### `GET /api/computer`

*   **Mô tả**: Lấy danh sách tất cả các máy tính có trong hệ thống.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "comp_id_1",
          "name": "PC Lab 01",
          "description": "Máy tính cấu hình mạnh cho AI",
          "natPortRdp": 3389,
          "natPortWinRm": 5985,
          "createdAt": "2023-11-19T10:00:00Z",
          "status": "available" // hoặc "busy"
        },
        // ... các máy tính khác
      ]
    }
    ```

#### `POST /api/computer`

*   **Mô tả**: Thêm một máy tính mới vào hệ thống.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
    *   **Body**:
        ```json
        {
          "name": "PC Lab 03",             // (String, Bắt buộc) Tên máy tính
          "description": "Máy tính cho Dev", // (String) Mô tả
          "natPortRdp": 3389,             // (Number, Bắt buộc) Port RDP NAT
          "natPortWinRm": 5985            // (Number, Bắt buộc) Port WinRM NAT
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã thêm máy tính vào hệ thống",
      "data": {
        "id": "new_comp_id",
        "name": "PC Lab 03",
        "description": "Máy tính cho Dev",
        "natPortRdp": 3389,
        "natPortWinRm": 5985,
        "createdAt": "2023-11-20T11:00:00Z",
        "status": "available"
      }
    }
    ```

#### `PUT /api/computer/:id`

*   **Mô tả**: Cập nhật thông tin của một máy tính.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
    *   **Path Parameters**:
        *   `id` (String, Bắt buộc): ID của máy tính cần cập nhật.
    *   **Body**:
        ```json
        {
          "name": "PC Lab 03 (Updated)",  // (String) Tên máy tính mới
          "description": "Máy tính cho lập trình viên", // (String) Mô tả mới
          "natPortRdp": 3390,             // (Number) Port RDP NAT mới
          "natPortWinRm": 5986            // (Number) Port WinRM NAT mới
        }
        ```
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã cập nhật thông tin máy tính",
      "data": {
        "id": "existing_comp_id",
        "name": "PC Lab 03 (Updated)",
        "description": "Máy tính cho lập trình viên",
        "natPortRdp": 3390,
        "natPortWinRm": 5986,
        "createdAt": "2023-11-20T11:00:00Z",
        "status": "available"
      }
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy máy tính"
    }
    ```

#### `DELETE /api/computer/:id`

*   **Mô tả**: Xóa một máy tính khỏi hệ thống.
*   **Yêu cầu**:
    *   **Headers**: `Authorization: Bearer <token>`
    *   **Path Parameters**:
        *   `id` (String, Bắt buộc): ID của máy tính cần xóa.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Đã xóa máy tính khỏi hệ thống"
    }
    ```
*   **Phản hồi lỗi (400 Bad Request)**:
    ```json
    {
      "status": "error",
      "message": "Không tìm thấy máy tính"
    }
    ```

---

## Quy trình sử dụng hệ thống Remote Lab

Hệ thống Remote Lab được thiết kế để hỗ trợ học viên đăng ký, thực hành và quản lý phiên làm việc từ xa trên các máy tính chuyên dụng. Dưới đây là mô tả chi tiết quy trình sử dụng chính:

### 1. Dành cho Học viên

#### 1.1. Đăng ký và Thanh toán Khóa học

1.  **Đăng ký thông tin:**
    *   Học viên truy cập trang đăng ký khóa học và cung cấp các thông tin cá nhân cơ bản như Họ, Tên, Email, Số điện thoại và Khóa học mong muốn.
    *   Hệ thống kiểm tra xem thông tin đã tồn tại hay chưa. Nếu đã có, hệ thống sẽ thông báo và hướng dẫn sử dụng tài khoản hiện có.

2.  **Tạo thanh toán:**
    *   Sau khi gửi thông tin, hệ thống sẽ tạo một yêu cầu thanh toán với số tiền khóa học (ví dụ: 100.000 VND) thông qua cổng thanh toán PayOS.
    *   Học viên sẽ nhận được mã QR hoặc liên kết thanh toán.

3.  **Hoàn tất thanh toán:**
    *   Học viên sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR và hoàn tất giao dịch.

4.  **Tạo tài khoản và ghi danh:**
    *   Khi thanh toán thành công, hệ thống sẽ tự động tạo một tài khoản học viên (nếu chưa tồn tại) với mật khẩu ngẫu nhiên.
    *   Hệ thống sẽ ghi danh học viên vào khóa học tương ứng trong Hệ thống quản lý học tập (LMS - Moodle).
    *   Học viên sẽ nhận được email xác nhận với thông tin đăng nhập (email và mật khẩu) cùng hướng dẫn sử dụng hệ thống Remote Lab.

#### 1.2. Đăng ký lịch Thực hành

1.  **Đăng nhập hệ thống:**
    *   Học viên sử dụng tài khoản đã được cấp (email và mật khẩu) để đăng nhập vào giao diện Remote Lab.

2.  **Đăng ký lịch:**
    *   Tại giao diện, học viên chọn thời gian bắt đầu và thời gian kết thúc mong muốn cho phiên thực hành.
    *   Hệ thống kiểm tra các điều kiện:
        *   Đảm bảo học viên đã được ghi danh vào khóa học.
        *   Thời gian đăng ký hợp lệ (ví dụ: không quá sớm so với hiện tại).
        *   Đảm bảo còn máy tính thực hành trống trong khoảng thời gian đã chọn.
    *   Nếu tất cả điều kiện được thỏa mãn, lịch thực hành sẽ được tạo với trạng thái "chờ duyệt" (`pending`).
    *   Quản trị viên sẽ nhận được thông báo về lịch đăng ký mới (thông qua email và giao diện quản lý).

#### 1.3. Nhận thông tin và Thực hành

1.  **Nhận thông tin truy cập:**
    *   Sau khi quản trị viên duyệt lịch của học viên, hệ thống sẽ gửi một email đến học viên.
    *   Email này chứa các thông tin cần thiết để kết nối vào phiên làm việc từ xa: địa chỉ Remote Desktop (RDP) (ví dụ: `tr1nh.net:PORT`), tên người dùng (username) và mật khẩu tạm thời cho phiên thực hành, cùng với thời gian bắt đầu và kết thúc.

2.  **Kết nối RDP:**
    *   Vào thời điểm bắt đầu lịch thực hành, học viên sử dụng các thông tin trong email để kết nối vào máy tính thực hành từ xa thông qua giao thức Remote Desktop (RDP).
    *   Hệ thống sẽ tự động tạo một tài khoản người dùng trên máy tính thực hành và thiết lập phiên làm việc SSH Tunnel an toàn.

3.  **Thực hành và nhắc nhở:**
    *   Trong quá trình thực hành, học viên có thể sử dụng máy tính như một máy tính thông thường.
    *   Khoảng 1 phút trước khi kết thúc phiên, hệ thống sẽ gửi một thông báo nhắc nhở đến phiên RDP của học viên.

4.  **Kết thúc phiên:**
    *   Khi thời gian thực hành kết thúc, hệ thống sẽ tự động xóa tài khoản người dùng tạm thời trên máy tính và khởi động lại máy để chuẩn bị cho phiên tiếp theo, đảm bảo môi trường sạch sẽ cho học viên khác.

### 2. Dành cho Quản trị viên

1.  **Đăng nhập:** Quản trị viên đăng nhập vào hệ thống bằng tài khoản được cấp.
2.  **Theo dõi thông báo:** Quản trị viên theo dõi các thông báo về học viên mới và lịch đăng ký thực hành mới (qua email và giao diện quản lý thời gian thực - SSE).
3.  **Duyệt lịch thực hành:** Quản trị viên xem các lịch thực hành đang chờ duyệt, kiểm tra thông tin và gán một máy tính thực hành có sẵn cho lịch đó. Sau đó, quản trị viên xác nhận duyệt lịch.
4.  **Quản lý máy tính:** Quản trị viên có thể thêm, chỉnh sửa hoặc xóa thông tin các máy tính thực hành trong hệ thống.
5.  **Hủy lịch thực hành:** Quản trị viên có thể hủy một lịch thực hành nếu cần thiết. Hệ thống sẽ thông báo cho học viên và giải phóng máy tính.

### 3. Các tính năng khác

*   **Thông báo thời gian thực (SSE):** Hệ thống sử dụng Server-Sent Events (SSE) để gửi thông báo tức thời đến quản trị viên khi có lịch đăng ký mới, giúp quản trị viên phản ứng nhanh chóng.
*   **Tích hợp LMS:** Hệ thống tích hợp với một Hệ thống quản lý học tập (LMS) như Moodle để quản lý danh sách học viên và ghi danh vào các khóa học.
*   **Gửi email tự động:** Hệ thống tự động gửi các email thông báo quan trọng đến học viên và quản trị viên trong suốt quá trình sử dụng.
