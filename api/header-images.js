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
        // Check both 'header' and 'headder' folder names
        const folderPath = path.join(process.cwd(), 'photos', 'headder');
        const altFolderPath = path.join(process.cwd(), 'photos', 'header');
        
        let folderPathToUse = null;
        if (fs.existsSync(folderPath)) {
            folderPathToUse = folderPath;
        } else if (fs.existsSync(altFolderPath)) {
            folderPathToUse = altFolderPath;
        }
        
        if (!folderPathToUse) {
            return res.json({ images: [], folder: 'none' });
        }
        
        const files = fs.readdirSync(folderPathToUse).filter(f => 
            /\.(jpg|jpeg|png|webp)$/i.test(f)
        );
        
        // Return the actual folder name that was found
        const actualFolderName = fs.existsSync(folderPath) ? 'headder' : 'header';
        res.json({ images: files, folder: actualFolderName });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

