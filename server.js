require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Kết nối MongoDB với xử lý lỗi
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log('Đã kết nối thành công với MongoDB');
})
.catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err.message);
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Lỗi kết nối:'));

// Schema cho quảng cáo
const adSchema = new mongoose.Schema({
    title: String,
    business: String,
    description: String,
    contact: String,
    address: String,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
    comments: {
        questions: [{ text: String, createdAt: { type: Date, default: Date.now } }],
        hearts: [{ text: String, createdAt: { type: Date, default: Date.now } }],
        ideas: [{ text: String, createdAt: { type: Date, default: Date.now } }],
        reports: [{ text: String, createdAt: { type: Date, default: Date.now } }]
    }
});

const Ad = mongoose.model('Ad', adSchema);

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WebP)'));
    }
});

// API endpoints
app.post('/api/ads', upload.single('image'), async (req, res) => {
    try {
        const { title, business, description, contact, address } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        const ad = new Ad({
            title,
            business,
            description,
            contact,
            address,
            imageUrl
        });

        await ad.save();
        res.status(201).json(ad);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/ads', async (req, res) => {
    try {
        const ads = await Ad.find().sort({ createdAt: -1 });
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ads/:id', async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
        }

        // Xóa file ảnh
        const imagePath = path.join(__dirname, ad.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await ad.deleteOne();
        res.json({ message: 'Xóa quảng cáo thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API endpoint cho comments
app.post('/api/ads/:id/comment', async (req, res) => {
    try {
        const { type, text } = req.body;
        const ad = await Ad.findById(req.params.id);
        
        if (!ad) {
            return res.status(404).json({ error: 'Không tìm thấy quảng cáo' });
        }

        const comment = { text, createdAt: new Date() };
        
        switch(type) {
            case 'question':
                ad.comments.questions.push(comment);
                break;
            case 'heart':
                ad.comments.hearts.push(comment);
                break;
            case 'idea':
                ad.comments.ideas.push(comment);
                break;
            case 'report':
                ad.comments.reports.push(comment);
                break;
            default:
                return res.status(400).json({ error: 'Loại bình luận không hợp lệ' });
        }

        await ad.save();
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Khởi động server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
}); 