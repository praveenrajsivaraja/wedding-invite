const { sendSignal, pollSignals } = require('../../lib/stream-signaling.cjs');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readJsonBody(req) {
    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    return {};
}

module.exports = async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        const peerId = req.query.peerId;
        const afterId = req.query.after || 0;

        if (!peerId) {
            return res.status(400).json({ error: 'peerId is required.' });
        }

        return res.status(200).json(pollSignals(peerId, afterId));
    }

    if (req.method === 'POST') {
        const body = readJsonBody(req);
        const result = sendSignal(body.from, body.to, body.type, body.payload);

        if (!result.ok) {
            return res.status(result.status || 400).json({ error: result.error });
        }

        return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
