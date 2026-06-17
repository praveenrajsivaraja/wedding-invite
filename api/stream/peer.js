const {
    joinPeer,
    leavePeer,
    heartbeatPeer
} = require('../../lib/stream-signaling.cjs');

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = readJsonBody(req);
    const action = body.action;

    if (action === 'join') {
        const result = joinPeer(body.role);
        if (!result.ok) {
            return res.status(result.status || 400).json({ error: result.error });
        }
        return res.status(200).json(result);
    }

    if (action === 'leave') {
        const result = leavePeer(body.peerId);
        return res.status(200).json(result);
    }

    if (action === 'heartbeat') {
        const result = heartbeatPeer(body.peerId);
        if (!result.ok) {
            return res.status(result.status || 404).json({ error: result.error });
        }
        return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid action.' });
};
