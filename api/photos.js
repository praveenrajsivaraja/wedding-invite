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
        const category = req.query.category || 'wedding';
        const folderPath = path.join(process.cwd(), 'photos', category);
        
        if (!fs.existsSync(folderPath)) {
            return res.json({ images: [] });
        }
        
        const files = fs.readdirSync(folderPath).filter(f => 
            /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
        );
        
        res.json({ images: files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

