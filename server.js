require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình multer với Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ad-management',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Kết nối MongoDB với xử lý lỗi và retry
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Đã kết nối MongoDB thành công');
    } catch (err) {
        console.error('Lỗi kết nối MongoDB:', err);
        // Thử kết nối lại sau 5 giây
        setTimeout(connectDB, 5000);
    }
};

connectDB();

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

// API endpoints
app.post('/api/ads', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng tải lên một hình ảnh' });
        }

        const imageUrl = req.file.path;
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

        // Xóa ảnh từ Cloudinary
        if (ad.imageUrl) {
            const publicId = ad.imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`ad-management/${publicId}`);
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