const { sendSignal, pollSignals } = require('../../lib/stream-signaling.cjs');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store');
}

async function readJsonBody(req) {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        return req.body;
    }

    if (typeof req.body === 'string' && req.body.trim()) {
        return JSON.parse(req.body);
    }

    const chunks = [];
    for await (const chunk of req) {
        chunks.push(chunk);
    }

    if (!chunks.length) {
        return {};
    }

    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

module.exports = async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const peerId = req.query.peerId;
            const afterId = req.query.after || 0;

            if (!peerId) {
                return res.status(400).json({ error: 'peerId is required.' });
            }

            const result = await pollSignals(peerId, afterId);
            return res.status(200).json(result);
        }

        if (req.method === 'POST') {
            const body = await readJsonBody(req);
            const result = await sendSignal(body.from, body.to, body.type, body.payload);

            if (!result.ok) {
                return res.status(result.status || 400).json({ error: result.error });
            }

            return res.status(200).json(result);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Stream signal error:', error);
        return res.status(500).json({ error: 'Stream signal request failed.' });
    }
};
