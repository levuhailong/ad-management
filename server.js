require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ file tĩnh từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Route cho trang chủ
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('Lỗi khi phục vụ file index.html:', error);
        res.status(500).send('Lỗi server');
    }
});

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

        // Lấy URL ảnh từ Cloudinary
        const imageUrl = req.file.path;
        console.log('Image URL:', imageUrl); // Log để debug

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
        res.status(500).json({ error: 'Lỗi server khi tạo quảng cáo', details: error.message });
    }
});

app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        console.error('Lỗi lấy danh sách quảng cáo:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách quảng cáo', details: error.message });
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
            try {
                // Lấy public_id từ URL
                const urlParts = ad.imageUrl.split('/');
                const publicId = urlParts[urlParts.length - 1].split('.')[0];
                console.log('Deleting image with public_id:', publicId); // Log để debug
                
                await cloudinary.uploader.destroy(`ad-management/${publicId}`);
                console.log('Image deleted successfully from Cloudinary'); // Log để debug
            } catch (cloudinaryError) {
                console.error('Lỗi xóa ảnh từ Cloudinary:', cloudinaryError);
                // Tiếp tục xóa quảng cáo ngay cả khi không xóa được ảnh
            }
        }

        await ad.deleteOne();
        res.json({ message: 'Đã xóa quảng cáo thành công' });
    } catch (error) {
        console.error('Lỗi xóa quảng cáo:', error);
        res.status(500).json({ error: 'Lỗi server khi xóa quảng cáo', details: error.message });
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
        res.status(500).json({ error: 'Lỗi server khi thêm bình luận', details: error.message });
    }
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
    console.error('Lỗi server:', err);
    res.status(500).json({ 
        error: 'Đã xảy ra lỗi server',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
    console.log('Cloudinary config:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? 'Đã cấu hình' : 'Chưa cấu hình',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'Đã cấu hình' : 'Chưa cấu hình'
    });
}); 