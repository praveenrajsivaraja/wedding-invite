const { put } = require('@vercel/blob');
const busboy = require('busboy');

// Enable CORS
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
    setCorsHeaders(res);
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        // Check if BLOB_READ_WRITE_TOKEN is configured
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return res.status(500).json({ 
                success: false,
                error: 'BLOB_READ_WRITE_TOKEN environment variable is not configured. Please add it in your Vercel project settings.',
                note: 'For local development, you can use the local server.js file'
            });
        }

        // Parse multipart form data using busboy
        const files = [];
        const bb = busboy({ headers: req.headers });
        
        const filePromises = [];
        
        bb.on('file', (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            
            // Validate file type (case-insensitive)
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
            const normalizedMimeType = mimeType ? mimeType.toLowerCase() : '';
            
            // Also check file extension as fallback for mobile
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
            
            if (!validTypes.includes(normalizedMimeType) && !hasValidExtension) {
                console.warn('File rejected - invalid type:', filename, 'MIME:', mimeType);
                file.resume(); // Drain the file stream
                return;
            }
            
            // Collect file data
            const chunks = [];
            let fileSize = 0;
            
            file.on('data', (chunk) => {
                chunks.push(chunk);
                fileSize += chunk.length;
                
                // Check file size limit (10MB)
                if (fileSize > 10 * 1024 * 1024) {
                    file.resume();
                    return;
                }
            });
            
            file.on('end', () => {
                if (fileSize > 0 && fileSize <= 10 * 1024 * 1024) {
                    const buffer = Buffer.concat(chunks);
                    files.push({
                        buffer,
                        filename,
                        mimeType,
                        size: fileSize
                    });
                }
            });
        });
        
        bb.on('finish', async () => {
            if (files.length === 0) {
                return res.status(400).json({ error: 'No valid files received. Files must be images (JPG, PNG, GIF, WEBP, BMP) and under 10MB.' });
            }
            
            if (files.length > 20) {
                return res.status(400).json({ error: 'Maximum 20 files allowed at once' });
            }

            // Upload files to Vercel Blob Storage
            const uploadedFiles = [];
            
            for (const file of files) {
                try {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                    const ext = file.filename.match(/\.[^.]+$/)?.[0] || '.jpg';
                    const filename = `upload-${uniqueSuffix}${ext}`;
                    const blobPath = `photos/others/${filename}`;
                    
                    const blob = await put(blobPath, file.buffer, {
                        access: 'public',
                        contentType: file.mimeType,
                        addRandomSuffix: false
                    });
                    
                    uploadedFiles.push({
                        filename: filename,
                        url: blob.url,
                        size: file.size
                    });
                } catch (uploadError) {
                    console.error('Error uploading file:', uploadError);
                    // Continue with other files
                }
            }

            if (uploadedFiles.length === 0) {
                return res.status(500).json({ error: 'Failed to upload files' });
            }

            res.json({ 
                success: true, 
                files: uploadedFiles.map(f => ({ filename: f.filename, size: f.size })),
                urls: uploadedFiles.map(f => f.url)
            });
        });
        
        bb.on('error', (err) => {
            console.error('Busboy error:', err);
            res.status(500).json({ error: 'Error parsing form data' });
        });
        
        req.pipe(bb);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
};
