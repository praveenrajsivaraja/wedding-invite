const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const folderPath = path.join(process.cwd(), 'photos', 'header');
        if (!fs.existsSync(folderPath)) {
            return res.json({ images: [], folder: 'none' });
        }
        const files = fs.readdirSync(folderPath).filter(f => 
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );
        console.log(`Header images API: Found ${files.length} images in folder: header`);
        res.json({ images: files, folder: 'header' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

