const {
    joinPeer,
    leavePeer,
    heartbeatPeer
} = require('../../lib/stream-signaling.cjs');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = await readJsonBody(req);
        const action = body.action;

        if (action === 'join') {
            const result = await joinPeer(body.role);
            if (!result.ok) {
                return res.status(result.status || 400).json({ error: result.error });
            }
            return res.status(200).json(result);
        }

        if (action === 'leave') {
            const result = await leavePeer(body.peerId);
            return res.status(200).json(result);
        }

        if (action === 'heartbeat') {
            const result = await heartbeatPeer(body.peerId);
            if (!result.ok) {
                return res.status(result.status || 404).json({ error: result.error });
            }
            return res.status(200).json(result);
        }

        return res.status(400).json({ error: 'Invalid action.' });
    } catch (error) {
        console.error('Stream peer error:', error);
        return res.status(500).json({ error: 'Stream peer request failed.' });
    }
};
