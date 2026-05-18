/**
 * Google Apps Script — paste into your spreadsheet:
 * Extensions → Apps Script → replace Code.gs → Deploy → New deployment → Web app
 * - Execute as: Me
 * - Who has access: Anyone
 *
 * Copy the web app URL into GOOGLE_SHEETS_WEBHOOK_URL (Vercel env + local .env)
 *
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1IP5B2LrRYmnokra0Vv7jYgNsm4t-oqjC3jEuikSOJfo/edit
 */

var SPREADSHEET_ID = '1IP5B2LrRYmnokra0Vv7jYgNsm4t-oqjC3jEuikSOJfo';
var SHEET_NAME = 'RSVP';

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = getOrCreateRsvpSheet_();

    sheet.appendRow([
      payload.submittedAt || new Date().toISOString(),
      payload.name || '',
      payload.phone || '',
      payload.attending || ''
    ]);

    return jsonResponse_({ success: true });
  } catch (err) {
    return jsonResponse_({ success: false, error: String(err.message || err) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, sheet: SHEET_NAME });
}

function getOrCreateRsvpSheet_() {
  var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Submitted At',
      'Name',
      'Phone',
      'Attending'
    ]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
