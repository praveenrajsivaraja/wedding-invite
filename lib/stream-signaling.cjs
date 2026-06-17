const fs = require('fs');
const path = require('path');

const BROADCASTER_TIMEOUT_MS = 30000;
const VIEWER_TIMEOUT_MS = 45000;
const MAX_MESSAGES = 500;
const STORE_FILE_PATH = path.join(__dirname, '..', 'data', 'stream-signaling.json');
const BLOB_PATHNAME = 'stream/signaling-state.json';

function createPeerId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createEmptyStore() {
    return {
        broadcasterId: null,
        broadcasterLastSeen: 0,
        viewers: [],
        messages: [],
        nextMessageId: 1
    };
}

function normalizeStore(rawStore) {
    const store = rawStore && typeof rawStore === 'object' ? rawStore : createEmptyStore();
    return {
        broadcasterId: store.broadcasterId || null,
        broadcasterLastSeen: Number(store.broadcasterLastSeen) || 0,
        viewers: Array.isArray(store.viewers) ? store.viewers : [],
        messages: Array.isArray(store.messages) ? store.messages : [],
        nextMessageId: Number(store.nextMessageId) || 1
    };
}

function serializeStore(store) {
    return {
        broadcasterId: store.broadcasterId,
        broadcasterLastSeen: store.broadcasterLastSeen,
        viewers: store.viewers,
        messages: store.messages,
        nextMessageId: store.nextMessageId
    };
}

async function loadStoreFromBlob() {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return null;
    }

    try {
        const { head } = require('@vercel/blob');
        const blobInfo = await head(BLOB_PATHNAME);
        const response = await fetch(blobInfo.url, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        return normalizeStore(await response.json());
    } catch (error) {
        if (error?.statusCode !== 404) {
            console.warn('Stream signaling blob load failed:', error.message);
        }
        return null;
    }
}

async function saveStoreToBlob(store) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return false;
    }

    const { put } = require('@vercel/blob');
    await put(BLOB_PATHNAME, JSON.stringify(serializeStore(store)), {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
        addRandomSuffix: false
    });
    return true;
}

function loadStoreFromFile() {
    try {
        if (!fs.existsSync(STORE_FILE_PATH)) {
            return null;
        }
        return normalizeStore(JSON.parse(fs.readFileSync(STORE_FILE_PATH, 'utf8')));
    } catch (error) {
        console.warn('Stream signaling file load failed:', error.message);
        return null;
    }
}

function saveStoreToFile(store) {
    const directoryPath = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(serializeStore(store)));
}

async function loadStore() {
    const blobStore = await loadStoreFromBlob();
    if (blobStore) {
        return blobStore;
    }

    const fileStore = loadStoreFromFile();
    if (fileStore) {
        return fileStore;
    }

    return createEmptyStore();
}

async function persistStore(store) {
    const savedToBlob = await saveStoreToBlob(store);
    if (!savedToBlob) {
        saveStoreToFile(store);
    }
}

async function withStore(mutator) {
    const store = await loadStore();
    const result = await mutator(store);
    await persistStore(store);
    return result;
}

function pruneMessages(messages) {
    if (messages.length <= MAX_MESSAGES) {
        return messages;
    }
    return messages.slice(messages.length - MAX_MESSAGES);
}

function isBroadcasterActive(store) {
    if (!store.broadcasterId) {
        return false;
    }
    return Date.now() - store.broadcasterLastSeen < BROADCASTER_TIMEOUT_MS;
}

function pruneInactiveViewers(store) {
    const now = Date.now();
    store.viewers = store.viewers.filter((viewer) => now - viewer.lastSeen < VIEWER_TIMEOUT_MS);
}

function clearBroadcaster(store) {
    store.broadcasterId = null;
    store.broadcasterLastSeen = 0;
    store.viewers = [];
    store.messages = [];
}

function touchViewer(store, viewerId) {
    const now = Date.now();
    const existingViewer = store.viewers.find((viewer) => viewer.id === viewerId);
    if (existingViewer) {
        existingViewer.lastSeen = now;
        return;
    }
    store.viewers.push({ id: viewerId, lastSeen: now });
}

async function joinPeer(role) {
    return withStore((store) => {
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
            store.viewers = [];
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
            touchViewer(store, peerId);

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
    });
}

async function leavePeer(peerId) {
    return withStore((store) => {
        if (store.broadcasterId === peerId) {
            clearBroadcaster(store);
            return { ok: true, left: true };
        }

        const hadViewer = store.viewers.some((viewer) => viewer.id === peerId);
        store.viewers = store.viewers.filter((viewer) => viewer.id !== peerId);

        if (hadViewer && store.broadcasterId) {
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

        return { ok: true, left: hadViewer };
    });
}

async function heartbeatPeer(peerId) {
    return withStore((store) => {
        if (store.broadcasterId === peerId) {
            store.broadcasterLastSeen = Date.now();
            return { ok: true, role: 'broadcaster', isLive: true };
        }

        const viewer = store.viewers.find((item) => item.id === peerId);
        if (viewer) {
            viewer.lastSeen = Date.now();
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
    });
}

async function sendSignal(from, to, type, payload) {
    return withStore((store) => {
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
    });
}

async function pollSignals(peerId, afterId = 0) {
    const store = await loadStore();
    const viewerCountBefore = store.viewers.length;
    pruneInactiveViewers(store);

    const parsedAfterId = Number(afterId) || 0;
    const messages = store.messages.filter(
        (message) => message.to === peerId && message.id > parsedAfterId
    );

    if (store.viewers.length !== viewerCountBefore) {
        await persistStore(store);
    }

    return {
        ok: true,
        isLive: isBroadcasterActive(store),
        broadcasterId: store.broadcasterId,
        viewerCount: store.viewers.length,
        messages
    };
}

async function getStreamStatus() {
    const store = await loadStore();
    const viewerCountBefore = store.viewers.length;
    pruneInactiveViewers(store);
    const wasActive = isBroadcasterActive(store);

    if (!wasActive && store.broadcasterId) {
        clearBroadcaster(store);
        await persistStore(store);
    } else if (store.viewers.length !== viewerCountBefore) {
        await persistStore(store);
    }

    return {
        ok: true,
        isLive: isBroadcasterActive(store),
        broadcasterId: store.broadcasterId,
        viewerCount: store.viewers.length
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
