// Note: File uploads in Vercel serverless functions have limitations
// The filesystem is read-only except for /tmp directory
// For production, consider using Vercel Blob Storage, AWS S3, or similar

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // This is a placeholder - actual file uploads require external storage
        // For now, return a helpful message
        res.json({ 
            success: false,
            message: 'File uploads require external storage in serverless environments. Consider using Vercel Blob Storage or AWS S3.',
            note: 'For development, you can use the local server.js file'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

