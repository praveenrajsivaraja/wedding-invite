/**
 * Friend-specific travel routes to the wedding venue (UMD: browser + Node tests).
 */
const FRIEND_ROUTES = {
    default: {
        from: { en: 'Your city', ta: 'உங்கள் நகரம்' },
        fromNote: {
            en: 'Wherever you are, your journey leads straight to our celebration.',
            ta: 'நீங்கள் எங்கிருந்தாலும், உங்கள் பயணம் எங்கள் கொண்டாட்டத்திற்கு வழிநடத்துகிறது.'
        },
        travel: {
            en: 'Plan your trip to Trichy for four days of festivities.',
            ta: 'நான்கு நாள் விழாவிற்காக திருச்சிக்கு பயணத்தைத் திட்டமிடுங்கள்.'
        },
        mapsOrigin: null
    },
    chennai: {
        from: { en: 'Chennai', ta: 'சென்னை' },
        fromNote: {
            en: 'Home turf for our Chennai paiyan — we cannot wait to see your crew on the dance floor.',
            ta: 'எங்கள் சென்னை பையனின் ஊர் — நடன தரையில் உங்கள் குழுவைப் பார்க்க ஆவலாக உள்ளோம்.'
        },
        travel: {
            en: '~330 km · about 5–6 hours by train or car via NH38',
            ta: 'சுமார் 330 கி.மீ · ரயில் அல்லது கார் வழி NH38 (~5–6 மணி)'
        },
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    coimbatore: {
        from: { en: 'Coimbatore', ta: 'கோயம்புத்தூர்' },
        fromNote: {
            en: 'Cross the hills with us — the celebration warms up as you arrive.',
            ta: 'மலைகளைக் கடந்து வாருங்கள் — நீங்கள் வந்தவுடன் கொண்டாட்டம் சூடுபிடிக்கும்.'
        },
        travel: {
            en: '~215 km · about 4–5 hours by road',
            ta: 'சுமார் 215 கி.மீ · சாலை வழி (~4–5 மணி)'
        },
        mapsOrigin: 'Coimbatore, Tamil Nadu, India'
    },
    bangalore: {
        from: { en: 'Bengaluru', ta: 'பெங்களூர்' },
        fromNote: {
            en: 'Down from the garden city — save energy for Sangeeth night!',
            ta: 'தோட்ட நகரத்திலிருந்து வருகிறீர்கள் — சங்கீத் இரவுக்கு ஆற்றலை சேமித்து வையுங்கள்!'
        },
        travel: {
            en: '~350 km · about 6–7 hours by train or overnight bus',
            ta: 'சுமார் 350 கி.மீ · ரயில் அல்லது இரவு பஸ் (~6–7 மணி)'
        },
        mapsOrigin: 'Bengaluru, Karnataka, India'
    },
    arun: {
        name: { en: 'Arun', ta: 'அருண்' },
        from: { en: 'Chennai', ta: 'சென்னை' },
        fromNote: {
            en: 'From our college-road chai stops to this mandap — your seat is reserved.',
            ta: 'கல்லூரி சாலை சை ஸ்டால்களிலிருந்து இந்த மணடபம் வரை — உங்களுக்கு இடம் ஒதுக்கப்பட்டுள்ளது.'
        },
        travel: {
            en: '~330 km · hop on the train Friday evening, land in Trichy ready to dance',
            ta: 'சுமார் 330 கி.மீ · வெள்ளி மாலை ரயிலில் ஏறி, நடனத்திற்கு தயாராக திருச்சியில் இறங்குங்கள்'
        },
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    priya: {
        name: { en: 'Priya', ta: 'பிரியா' },
        from: { en: 'Chennai', ta: 'சென்னை' },
        fromNote: {
            en: 'Our forever brunch buddy — Haldi colours will look even brighter with you there.',
            ta: 'எங்கள் நிரந்தர பிரஞ்ச் தோழி — நீங்கள் வந்தால் ஹல்தி வண்ணங்கள் இன்னும் பிரகாசமாக இருக்கும்.'
        },
        travel: {
            en: '~330 km · car-pool with the gang or take the morning express',
            ta: 'சுமார் 330 கி.மீ · குழுவுடன் கார் பூல் அல்லது காலை எக்ஸ்பிரஸ்'
        },
        mapsOrigin: 'Chennai, Tamil Nadu, India'
    },
    karthik: {
        name: { en: 'Karthik', ta: 'கார்த்திக்' },
        from: { en: 'Madurai', ta: 'மதுரை' },
        fromNote: {
            en: 'Just down the highway — you are practically family for all four days.',
            ta: 'நெடுஞ்சாலையில் அருகில் — நான்கு நாட்களும் நீங்கள் ஏறக்குறைய குடும்பமே.'
        },
        travel: {
            en: '~145 km · about 2.5 hours — first to arrive, first on the dance floor',
            ta: 'சுமார் 145 கி.மீ · சுமார் 2.5 மணி — முதலில் வருபவர், முதலில் நடனம்'
        },
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

function pickLocalized(value, lang) {
    if (!value) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    return value[lang] || value.en || '';
}

function buildMapsDirectionsUrl(origin) {
    const destination = encodeURIComponent(WEDDING_VENUE_QUERY);
    if (!origin) {
        return `https://www.google.com/maps/search/?api=1&query=${destination}`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${destination}&travelmode=driving`;
}

function getFriendRouteView(routeKey, lang, templates) {
    const route = FRIEND_ROUTES[routeKey] || FRIEND_ROUTES.default;
    const safeLang = lang === 'ta' ? 'ta' : 'en';
    const labels = templates[safeLang] || templates.en;
    const friendName = pickLocalized(route.name, safeLang);
    const fromCity = pickLocalized(route.from, safeLang);

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
        fromNote: pickLocalized(route.fromNote, safeLang),
        travel: pickLocalized(route.travel, safeLang),
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
