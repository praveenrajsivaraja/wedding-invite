/**
 * Friend-specific travel routes to the wedding venue (UMD: browser + Node tests).
 */
const FRIEND_ROUTES = {
    default: {
        from: 'Your city',
        fromNote: 'Wherever you are, your journey leads straight to our celebration.',
        travel: 'Plan your trip to Trichy for four days of festivities.',
        mapsOrigin: null
    },
    chennai: {
        from: 'Chennai',
        fromNote: 'Home turf for our Chennai paiyan — we cannot wait to see your crew on the dance floor.',
        travel: '~330 km · about 5–6 hours by train or car via NH38',
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    coimbatore: {
        from: 'Coimbatore',
        fromNote: 'Cross the hills with us — the celebration warms up as you arrive.',
        travel: '~215 km · about 4–5 hours by road',
        mapsOrigin: 'Coimbatore, Tamil Nadu, India'
    },
    bangalore: {
        from: 'Bengaluru',
        fromNote: 'Down from the garden city — save energy for Sangeeth night!',
        travel: '~350 km · about 6–7 hours by train or overnight bus',
        mapsOrigin: 'Bengaluru, Karnataka, India'
    },
    arun: {
        name: 'Arun',
        from: 'Chennai',
        fromNote: 'From our college-road chai stops to this mandap — your seat is reserved.',
        travel: '~330 km · hop on the train Friday evening, land in Trichy ready to dance',
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    priya: {
        name: 'Priya',
        from: 'Chennai',
        fromNote: 'Our forever brunch buddy — Haldi colours will look even brighter with you there.',
        travel: '~330 km · car-pool with the gang or take the morning express',
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    karthik: {
        name: 'Karthik',
        from: 'Madurai',
        fromNote: 'Just down the highway — you are practically family for all four days.',
        travel: '~145 km · about 2.5 hours — first to arrive, first on the dance floor',
        mapsOrigin: 'Madurai, Tamil Nadu, India'
    }
};

const WEDDING_VENUE_QUERY = 'Shree Narayana Mahall, Trichy, Tamil Nadu, India';

function normalizeRouteKey(raw) {
    if (typeof raw !== 'string') {
        return '';
    }
    return raw.trim().toLowerCase().replace(/\s+/g, '-');
}

function resolveFriendRouteKey(searchParams) {
    const params = searchParams || new URLSearchParams();
    const friendKey = normalizeRouteKey(params.get('friend') || '');
    if (friendKey && FRIEND_ROUTES[friendKey]) {
        return friendKey;
    }

    const fromKey = normalizeRouteKey(params.get('from') || '');
    if (fromKey && FRIEND_ROUTES[fromKey]) {
        return fromKey;
    }

    return 'default';
}

function pickLocalized(value) {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.en || '';
}

function buildMapsDirectionsUrl(origin) {
    const destination = encodeURIComponent(WEDDING_VENUE_QUERY);
    if (!origin) {
        return `https://www.google.com/maps/search/?api=1&query=${destination}`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${destination}&travelmode=driving`;
}

function getFriendRouteView(routeKey, _lang, templates) {
    const route = FRIEND_ROUTES[routeKey] || FRIEND_ROUTES.default;
    const labels = templates.en || templates;
    const friendName = pickLocalized(route.name);
    const fromCity = pickLocalized(route.from);

    const title = friendName
        ? interpolate(labels.routeTitleNamed, { name: friendName })
        : labels.routeTitle;

    const greeting = friendName
        ? interpolate(labels.routeGreetingNamed, { name: friendName, from: fromCity })
        : labels.routeGreeting;

    return {
        routeKey,
        title,
        greeting,
        fromCity,
        fromNote: pickLocalized(route.fromNote),
        travel: pickLocalized(route.travel),
        destinationVenue: labels.routeDestVenue,
        destinationNote: labels.routeDestNote,
        startLabel: labels.routeStart,
        travelLabel: labels.routeTravel,
        destinationLabel: labels.routeDestination,
        openMapsLabel: labels.routeOpenMaps,
        mapsUrl: buildMapsDirectionsUrl(route.mapsOrigin)
    };
}

function interpolate(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

function createFriendRouteApi() {
    return {
        FRIEND_ROUTES,
        WEDDING_VENUE_QUERY,
        normalizeRouteKey,
        resolveFriendRouteKey,
        getFriendRouteView,
        buildMapsDirectionsUrl
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = createFriendRouteApi();
} else {
    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    root.WeddingInvite = root.WeddingInvite || {};
    root.WeddingInvite.friendRoute = createFriendRouteApi();
}
