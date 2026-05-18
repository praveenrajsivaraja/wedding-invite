const { handleRsvpRequest } = require('../lib/rsvp-handler');

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
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const result = await handleRsvpRequest(req.body);
        return res.status(200).json(result);
    } catch (error) {
        if (error.code === 'VALIDATION_ERROR') {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error.code === 'NOT_CONFIGURED') {
            return res.status(503).json({ success: false, error: error.message });
        }
        console.error('RSVP API error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to save RSVP'
        });
    }
};
