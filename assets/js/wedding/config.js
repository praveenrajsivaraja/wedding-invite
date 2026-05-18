/**
 * Wedding invite configuration (Nova template app layer).
 */
(function initWeddingConfig(global) {
    'use strict';

    global.WeddingInvite = global.WeddingInvite || {};

    global.WeddingInvite.config = {
        ENGAGEMENT_DATE: new Date('2026-01-28T00:00:00').getTime(),
        MARRIAGE_DATE: new Date(2026, 5, 18, 9, 30, 0).getTime(),
        IMAGES_PER_PAGE: 24,
        LOCATIONS: {
            engagement: {
                name: 'Hotel Padmavathi',
                address: 'Palpannai, Trichy, Tamil Nadu',
                lat: 10.8131113,
                lng: 78.7057293,
                mapLink: 'https://maps.app.goo.gl/7YjUhTCX7Niii8My6'
            },
            marriage: {
                name: 'Shree Narayana Mahall',
                address: 'Trichy, Tamil Nadu',
                lat: 10.8732209,
                lng: 78.7062234,
                mapLink: 'https://maps.app.goo.gl/aerwBkYg2dg1Xda67'
            }
        }
    };
})(typeof window !== 'undefined' ? window : globalThis);
