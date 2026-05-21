const { listHeaderImages } = require('../lib/header-images.cjs');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const images = listHeaderImages();
        if (images.length > 0) {
            return res.json({ images, folder: 'header' });
        }
        return res.json({ images: [], folder: 'none' });
    } catch (error) {
        console.error('Header images API error:', error);
        return res.status(500).json({ error: error.message });
    }
};
