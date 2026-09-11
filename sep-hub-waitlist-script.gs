/**
 * SEP Hub Waitlist - Google Apps Script Web App
 *
 * Receives waitlist signups from the form on hub.html and appends them to a
 * Google Sheet. Sheet only: no email sending, no Brevo, no mailing list.
 *
 * Sheet name:  SEP Hub Waitlist
 * Columns:     Timestamp | First Name | Last Name | Email | Phone | Business Category
 *
 * Deploy as a Web App, execute as yourself, access set to Anyone.
 * Paste the resulting URL into HUB_WAITLIST_URL near the top of js/main.js.
 */

// Tab name inside the spreadsheet. Must match exactly, including spaces.
var SHEET_NAME = 'SEP Hub Waitlist';

// Email is the 4th column: Timestamp(1) First(2) Last(3) Email(4) Phone(5) Category(6)
var EMAIL_COLUMN = 4;


function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var firstName = String(data.firstName || '').trim();
    var lastName  = String(data.lastName  || '').trim();
    var email     = String(data.email     || '').trim();
    var phone     = String(data.phone     || '').trim();
    var category  = String(data.category  || '').trim();

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found. Check the tab name.');
    }

    // Someone already on the list is not an error, tell the site so it can
    // show the same friendly confirmation rather than a failure message.
    if (isDuplicate(sheet, email)) {
      return jsonOut({ result: 'already_registered' });
    }

    sheet.appendRow([new Date(), firstName, lastName, email, phone, category]);

    return jsonOut({ result: 'success' });

  } catch (err) {
    return jsonOut({ result: 'error', message: err.toString() });
  }
}


/**
 * True if this email is already in the Email column. Case insensitive, and
 * surrounding spaces are ignored, so "Ada@Mail.com " matches "ada@mail.com".
 */
function isDuplicate(sheet, email) {
  if (!email) return false;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;   // header row only, nothing to compare against

  var values = sheet.getRange(2, EMAIL_COLUMN, lastRow - 1, 1).getValues();
  var target = email.toLowerCase();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === target) {
      return true;
    }
  }
  return false;
}


/** Wraps an object as a JSON response. */
function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Optional. Open the Web App URL in a browser to confirm it is live.
 * Returns a plain message, it does not touch the sheet.
 */
function doGet() {
  return jsonOut({ result: 'ok', message: 'SEP Hub Waitlist endpoint is live.' });
}
