const fs = require('fs');
const path = require('path');
const { list } = require('@vercel/blob');

// Enable CORS
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const category = req.query.category || 'wedding';
        
        // Get static photos from filesystem (for existing photos)
        const staticPhotos = [];
        const folderPath = path.join(process.cwd(), 'photos', category);
        
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath).filter(f => 
                /\.(jpg|jpeg|png|webp|gif)$/i.test(f)
            );
            staticPhotos.push(...files);
        }
        
        // Get photos from Vercel Blob Storage (for uploaded photos)
        const blobPhotoMap = new Map(); // filename -> url
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            try {
                const prefix = `photos/${category}/`;
                const { blobs } = await list({ prefix });
                
                // Map filename to blob URL
                blobs
                    .filter(blob => /\.(jpg|jpeg|png|webp|gif)$/i.test(blob.pathname))
                    .forEach(blob => {
                        // Extract filename from path like "photos/others/filename.jpg"
                        const parts = blob.pathname.split('/');
                        const filename = parts[parts.length - 1];
                        blobPhotoMap.set(filename, blob.url);
                    });
            } catch (blobError) {
                console.error('Error fetching from blob storage:', blobError);
                // Continue with static photos only
            }
        }
        
        // Combine photos: static photos use filename, blob photos include URL
        const allPhotos = staticPhotos.map(filename => ({
            filename,
            url: blobPhotoMap.has(filename) ? blobPhotoMap.get(filename) : null
        }));
        
        // Add blob-only photos (not in static folder)
        blobPhotoMap.forEach((url, filename) => {
            if (!staticPhotos.includes(filename)) {
                allPhotos.push({ filename, url });
            }
        });
        
        res.json({ images: allPhotos });
    } catch (err) {
        console.error('Photos API error:', err);
        res.status(500).json({ error: err.message });
    }
};
