# Quản lý Quảng cáo

Hệ thống quản lý quảng cáo với các chức năng:
- Đăng quảng cáo mới
- Upload hình ảnh
- Xem danh sách quảng cáo
- Bình luận với 4 loại: câu hỏi, cảm nhận, ý kiến, báo cáo
- Xóa quảng cáo

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/levuhailong/ad-management.git
cd ad-management
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env:
```
PORT=3001
MONGODB_URI=your_mongodb_uri
NODE_ENV=development
```

4. Khởi động server:
```bash
npm start
```

## Công nghệ sử dụng

- Node.js
- Express
- MongoDB
- HTML/CSS/JavaScript 