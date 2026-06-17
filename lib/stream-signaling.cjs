const BROADCASTER_TIMEOUT_MS = 15000;
const VIEWER_TIMEOUT_MS = 30000;
const MAX_MESSAGES = 500;

function createPeerId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function pruneMessages(messages) {
    if (messages.length <= MAX_MESSAGES) {
        return messages;
    }
    return messages.slice(messages.length - MAX_MESSAGES);
}

function createStreamSignalingStore() {
    return {
        broadcasterId: null,
        broadcasterLastSeen: 0,
        viewers: new Map(),
        messages: [],
        nextMessageId: 1
    };
}

function getStore() {
    if (!globalThis.__weddingStreamSignalingStore) {
        globalThis.__weddingStreamSignalingStore = createStreamSignalingStore();
    }
    return globalThis.__weddingStreamSignalingStore;
}

function isBroadcasterActive(store) {
    if (!store.broadcasterId) {
        return false;
    }
    return Date.now() - store.broadcasterLastSeen < BROADCASTER_TIMEOUT_MS;
}

function pruneInactiveViewers(store) {
    const now = Date.now();
    for (const [viewerId, lastSeen] of store.viewers.entries()) {
        if (now - lastSeen > VIEWER_TIMEOUT_MS) {
            store.viewers.delete(viewerId);
        }
    }
}

function clearBroadcaster(store) {
    store.broadcasterId = null;
    store.broadcasterLastSeen = 0;
    store.viewers.clear();
    store.messages = [];
}

function joinPeer(role) {
    const store = getStore();
    pruneInactiveViewers(store);

    if (role === 'broadcaster') {
        if (isBroadcasterActive(store)) {
            return {
                ok: false,
                status: 409,
                error: 'Another device is already broadcasting.'
            };
        }

        const peerId = createPeerId();
        store.broadcasterId = peerId;
        store.broadcasterLastSeen = Date.now();
        store.viewers.clear();
        store.messages = [];

        return {
            ok: true,
            peerId,
            role: 'broadcaster',
            isLive: true
        };
    }

    if (role === 'viewer') {
        if (!isBroadcasterActive(store)) {
            return {
                ok: false,
                status: 404,
                error: 'No live broadcast is available right now.'
            };
        }

        const peerId = createPeerId();
        store.viewers.set(peerId, Date.now());

        store.messages.push({
            id: store.nextMessageId++,
            from: peerId,
            to: store.broadcasterId,
            type: 'viewer-joined',
            payload: { viewerId: peerId },
            createdAt: Date.now()
        });
        store.messages = pruneMessages(store.messages);

        return {
            ok: true,
            peerId,
            role: 'viewer',
            broadcasterId: store.broadcasterId,
            isLive: true
        };
    }

    return {
        ok: false,
        status: 400,
        error: 'Invalid role.'
    };
}

function leavePeer(peerId) {
    const store = getStore();

    if (store.broadcasterId === peerId) {
        clearBroadcaster(store);
        return { ok: true, left: true };
    }

    if (store.viewers.delete(peerId)) {
        if (store.broadcasterId) {
            store.messages.push({
                id: store.nextMessageId++,
                from: peerId,
                to: store.broadcasterId,
                type: 'viewer-left',
                payload: { viewerId: peerId },
                createdAt: Date.now()
            });
            store.messages = pruneMessages(store.messages);
        }
        return { ok: true, left: true };
    }

    return { ok: true, left: false };
}

function heartbeatPeer(peerId) {
    const store = getStore();

    if (store.broadcasterId === peerId) {
        store.broadcasterLastSeen = Date.now();
        return { ok: true, role: 'broadcaster', isLive: true };
    }

    if (store.viewers.has(peerId)) {
        store.viewers.set(peerId, Date.now());
        return {
            ok: true,
            role: 'viewer',
            isLive: isBroadcasterActive(store),
            broadcasterId: store.broadcasterId
        };
    }

    if (!isBroadcasterActive(store)) {
        clearBroadcaster(store);
    }

    return { ok: false, status: 404, error: 'Peer session expired.' };
}

function sendSignal(from, to, type, payload) {
    const store = getStore();

    if (!from || !to || !type) {
        return { ok: false, status: 400, error: 'Missing signal fields.' };
    }

    const message = {
        id: store.nextMessageId++,
        from,
        to,
        type,
        payload,
        createdAt: Date.now()
    };

    store.messages.push(message);
    store.messages = pruneMessages(store.messages);

    return { ok: true, messageId: message.id };
}

function pollSignals(peerId, afterId = 0) {
    const store = getStore();
    pruneInactiveViewers(store);

    const parsedAfterId = Number(afterId) || 0;
    const messages = store.messages.filter(
        (message) => message.to === peerId && message.id > parsedAfterId
    );

    return {
        ok: true,
        isLive: isBroadcasterActive(store),
        broadcasterId: store.broadcasterId,
        viewerCount: store.viewers.size,
        messages
    };
}

function getStreamStatus() {
    const store = getStore();
    pruneInactiveViewers(store);

    if (!isBroadcasterActive(store)) {
        clearBroadcaster(store);
    }

    return {
        ok: true,
        isLive: isBroadcasterActive(store),
        broadcasterId: store.broadcasterId,
        viewerCount: store.viewers.size
    };
}

module.exports = {
    joinPeer,
    leavePeer,
    heartbeatPeer,
    sendSignal,
    pollSignals,
    getStreamStatus
};
