require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Kết nối MongoDB với xử lý lỗi
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Đã kết nối MongoDB thành công'))
    .catch(err => {
        console.error('Lỗi kết nối MongoDB:', err);
        process.exit(1);
    });

// Schema quảng cáo
const adSchema = new mongoose.Schema({
    title: String,
    business: String,
    description: String,
    contact: String,
    address: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
    comments: [{
        type: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
});

const Ad = mongoose.model('Ad', adSchema);

// Cấu hình multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Định dạng file không được hỗ trợ'));
        }
    }
});

// API endpoints
app.post('/api/ads', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng tải lên một hình ảnh' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        const ad = new Ad({
            title: req.body.title,
            business: req.body.business,
            description: req.body.description,
            contact: req.body.contact,
            address: req.body.address,
            imageUrl: imageUrl
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (error) {
        console.error('Lỗi tạo quảng cáo:', error);
        res.status(500).json({ error: 'Lỗi server khi tạo quảng cáo' });
    }
});

app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        console.error('Lỗi lấy danh sách quảng cáo:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách quảng cáo' });
    }
});

app.delete('/api/ads/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
        }

        // Xóa file ảnh
        if (ad.imageUrl) {
            const imagePath = path.join(__dirname, ad.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await ad.deleteOne();
        res.json({ message: 'Đã xóa quảng cáo thành công' });
    } catch (error) {
        console.error('Lỗi xóa quảng cáo:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa quảng cáo' });
    }
});

app.post('/api/ads/:id/comment', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
        }

        ad.comments.push({
            type: req.body.type,
            text: req.body.text
        });

        await ad.save();
        res.json(ad);
    } catch (error) {
        console.error('Lỗi thêm bình luận:', error);
        res.status(500).json({ error: 'Lỗi server khi thêm bình luận' });
    }
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
    console.error('Lỗi server:', err);
    res.status(500).json({ error: 'Đã xảy ra lỗi server' });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
}); 