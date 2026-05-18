/**
 * Shared RSVP validation and Google Sheets webhook submission.
 * Set GOOGLE_SHEETS_WEBHOOK_URL to your deployed Apps Script web app URL.
 */

const SPREADSHEET_ID = '1IP5B2LrRYmnokra0Vv7jYgNsm4t-oqjC3jEuikSOJfo';

const MAX_NAME_LENGTH = 120;
const MAX_PHONE_LENGTH = 30;

function sanitizeText(value, maxLength) {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().slice(0, maxLength);
}

function validateRsvpPayload(body) {
    if (!body || typeof body !== 'object') {
        return { isValid: false, error: 'Invalid request body' };
    }

    const name = sanitizeText(body.name, MAX_NAME_LENGTH);
    const phone = sanitizeText(body.phone, MAX_PHONE_LENGTH);
    const attending = sanitizeText(body.attending, 10).toLowerCase();

    if (!name) {
        return { isValid: false, error: 'Name is required' };
    }

    if (!phone) {
        return { isValid: false, error: 'Phone number is required' };
    }

    if (attending !== 'yes' && attending !== 'no') {
        return { isValid: false, error: 'Please select whether you will attend' };
    }

    return {
        isValid: true,
        data: {
            name,
            phone,
            attending,
            submittedAt: new Date().toISOString()
        }
    };
}

async function submitRsvpToGoogleSheets(payload, webhookUrl) {
    const url = webhookUrl || process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!url) {
        const error = new Error(
            'RSVP is not configured. Set GOOGLE_SHEETS_WEBHOOK_URL to your Google Apps Script web app URL.'
        );
        error.code = 'NOT_CONFIGURED';
        throw error;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            spreadsheetId: SPREADSHEET_ID,
            ...payload
        })
    });

    const responseText = await response.text();
    let result = {};
    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch {
        result = { raw: responseText };
    }

    if (!response.ok || result.success === false) {
        const error = new Error(result.error || `Google Sheets submission failed (${response.status})`);
        error.code = 'SHEETS_ERROR';
        throw error;
    }

    return result;
}

async function handleRsvpRequest(body) {
    const validation = validateRsvpPayload(body);
    if (!validation.isValid) {
        const error = new Error(validation.error);
        error.code = 'VALIDATION_ERROR';
        throw error;
    }

    await submitRsvpToGoogleSheets(validation.data);
    return { success: true, message: 'RSVP saved successfully' };
}

module.exports = {
    SPREADSHEET_ID,
    validateRsvpPayload,
    submitRsvpToGoogleSheets,
    handleRsvpRequest
};
