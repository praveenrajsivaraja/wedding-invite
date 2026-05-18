const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
    resolveFriendRouteKey,
    getFriendRouteView,
    normalizeRouteKey,
    buildMapsDirectionsUrl
} = require('../lib/friend-route');

const ROUTE_LABELS = {
    en: {
        routeTitle: 'Your Route to Celebrate With Us',
        routeTitleNamed: '{name}, Your Route to Us',
        routeGreeting: 'Generic greeting',
        routeGreetingNamed: 'Hey {name}! From {from} to Trichy.',
        routeStart: 'Start',
        routeTravel: 'Travel',
        routeDestination: 'Destination',
        routeDestVenue: 'Venue',
        routeDestNote: 'Note',
        routeOpenMaps: 'Open Maps'
    }
};

test('normalizeRouteKey trims and lowercases', () => {
    assert.equal(normalizeRouteKey('  Arun '), 'arun');
    assert.equal(normalizeRouteKey('Coimbatore'), 'coimbatore');
});

test('resolveFriendRouteKey prefers friend param over from', () => {
    const params = new URLSearchParams('friend=arun&from=chennai');
    assert.equal(resolveFriendRouteKey(params), 'arun');
});

test('resolveFriendRouteKey falls back to from param', () => {
    const params = new URLSearchParams('from=coimbatore');
    assert.equal(resolveFriendRouteKey(params), 'coimbatore');
});

test('resolveFriendRouteKey uses default for unknown keys', () => {
    const params = new URLSearchParams('friend=unknown-person');
    assert.equal(resolveFriendRouteKey(params), 'default');
});

test('getFriendRouteView personalizes named friends', () => {
    const view = getFriendRouteView('arun', 'en', ROUTE_LABELS);
    assert.equal(view.routeKey, 'arun');
    assert.equal(view.title, 'Arun, Your Route to Us');
    assert.match(view.greeting, /Hey Arun!/);
    assert.equal(view.fromCity, 'Chennai');
    assert.equal(view.rsvpName, 'Arun');
});

test('getFriendRouteView uses city-only route without a name', () => {
    const view = getFriendRouteView('chennai', 'en', ROUTE_LABELS);
    assert.equal(view.title, 'Your Route to Celebrate With Us');
    assert.equal(view.rsvpName, '');
    assert.equal(view.fromCity, 'Chennai');
});

test('buildMapsDirectionsUrl includes origin when provided', () => {
    const url = buildMapsDirectionsUrl('Chennai, Tamil Nadu, India');
    assert.match(url, /origin=Chennai/);
    assert.match(url, /destination=/);
});
