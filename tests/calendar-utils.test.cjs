'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const utilsPath = path.join(__dirname, '..', 'calendar-utils.js');
const code = fs.readFileSync(utilsPath, 'utf8');
vm.runInThisContext(code, { filename: 'calendar-utils.js' });

const { WeddingCalendarUtils } = globalThis;

test('buildGoogleCalendarUrl includes host and encoded title', () => {
    const url = WeddingCalendarUtils.buildGoogleCalendarUrl({
        title: 'Engagement Test',
        startDate: new Date(2026, 0, 28),
        endDateExclusive: new Date(2026, 0, 29),
        details: 'Hello',
        location: 'Trichy'
    });
    assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
    assert.ok(url.includes('text=Engagement+Test') || url.includes('text=Engagement%20Test'));
    assert.ok(url.includes('dates=20260128%2F20260129') || url.includes('dates=20260128/20260129'));
});

test('buildIcsCalendar contains calendar shell and summary', () => {
    const ics = WeddingCalendarUtils.buildIcsCalendar({
        events: [
            {
                title: 'Wedding Day',
                startDate: new Date(2026, 5, 18),
                endDateExclusive: new Date(2026, 5, 19),
                location: 'Mahal',
                description: 'Ceremony'
            }
        ]
    });
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.match(ics, /END:VCALENDAR/);
    assert.match(ics, /BEGIN:VEVENT/);
    assert.match(ics, /SUMMARY:Wedding Day/);
    assert.match(ics, /DTSTART;VALUE=DATE:20260618/);
    assert.match(ics, /DTEND;VALUE=DATE:20260619/);
});
