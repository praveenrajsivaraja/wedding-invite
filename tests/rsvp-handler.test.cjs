const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateRsvpPayload } = require('../lib/rsvp-handler');

test('validateRsvpPayload requires name, phone, and attending', () => {
    const missingName = validateRsvpPayload({
        phone: '9876543210',
        attending: 'yes'
    });
    assert.equal(missingName.isValid, false);

    const missingPhone = validateRsvpPayload({
        name: 'Guest',
        attending: 'yes'
    });
    assert.equal(missingPhone.isValid, false);

    const missingAttending = validateRsvpPayload({
        name: 'Guest',
        phone: '9876543210'
    });
    assert.equal(missingAttending.isValid, false);
});

test('validateRsvpPayload accepts valid submission', () => {
    const result = validateRsvpPayload({
        name: 'Guest Name',
        phone: '+91 9876543210',
        attending: 'yes'
    });
    assert.equal(result.isValid, true);
    assert.equal(result.data.name, 'Guest Name');
    assert.equal(result.data.phone, '+91 9876543210');
    assert.equal(result.data.attending, 'yes');
});

test('validateRsvpPayload accepts not attending', () => {
    const result = validateRsvpPayload({
        name: 'Guest Name',
        phone: '9876543210',
        attending: 'no'
    });
    assert.equal(result.isValid, true);
    assert.equal(result.data.attending, 'no');
});
