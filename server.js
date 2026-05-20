require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 2801;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// YouTube embeds (Error 153) require a valid Referer from the parent page
app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'photos', 'others');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `upload-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/upload', upload.array('photos', 20), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files received' });
        }
        const files = req.files.map(f => ({ filename: f.filename, size: f.size }));
        res.json({ success: true, files: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/photos', (req, res) => {
    const category = req.query.category || 'wedding';
    const folderPath = path.join(__dirname, 'photos', category);
    if (!fs.existsSync(folderPath)) return res.json({ images: [] });
    const files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    res.json({ images: files });
});

app.get('/api/header-images', (req, res) => {
    const headerPath = path.join(__dirname, 'photos', 'header');
    if (fs.existsSync(headerPath)) {
        const headerFiles = fs.readdirSync(headerPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
        if (headerFiles.length > 0) {
            return res.json({ images: headerFiles, folder: 'header' });
        }
    }

    const engagementPath = path.join(__dirname, 'photos', 'engagement');
    if (fs.existsSync(engagementPath)) {
        const engagementFiles = fs.readdirSync(engagementPath)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .slice(0, 5);
        if (engagementFiles.length > 0) {
            return res.json({ images: engagementFiles, folder: 'engagement' });
        }
    }

    res.json({ images: [], folder: 'none' });
});

app.use('/photos', express.static(path.join(__dirname, 'photos')));
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});