// @ts-nocheck
// SEP 2027 early interest list handler
// Saves each submission to its own Google Sheet. Sheet only: no Brevo, no
// confirmation email. Separate from sep-registration-script.gs, which handles
// SEP 2026 and is not changed by this file.
//
// Deploy as a Web App, execute as yourself, access set to Anyone. Paste the
// resulting /exec URL into Netlify as the SEP_2027_SCRIPT_URL environment
// variable. netlify/functions/register-2027.js reads it from there.
//
// SHEET COLUMNS, left to right. Header row in row 1. Email must stay in
// column 4, which isDuplicate below depends on.
//   1 Timestamp  2 First name  3 Last name  4 Email  5 Phone
//   6 Gender  7 Age Range  8 How Heard

// Tab name inside the spreadsheet. Must match exactly, including spaces.
var SHEET_NAME = 'Sheet1';

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error('Sheet "' + SHEET_NAME + '" not found. Check the tab name.');
    }

    var data = JSON.parse(e.postData.contents);
    var email = (data.email || '').toString().trim().toLowerCase();

    // Guard: if this email is already on the list, do not add again.
    if (email && isDuplicate(sheet, email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'already_registered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([
      new Date(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.gender || '',
      data.ageRange || '',
      data.heardAbout || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Returns true if the email is already present in the Sheet's Email column (column D, index 4).
function isDuplicate(sheet, email) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return false; // only the header row exists, nothing to compare
  }
  // Column 4 is Email (Timestamp, First name, Last name, Email, ...).
  var emails = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    var existing = (emails[i][0] || '').toString().trim().toLowerCase();
    if (existing && existing === email) {
      return true;
    }
  }
  return false;
}

// Deliberately NOT defined: doGet. Same reason as sep-hub-waitlist-script.gs:
// a doGet here could answer the redirect hop for a write that never happened.
// Leaving it out makes that path fail loudly so the retry in js/main.js
// re-sends. To check the deployment is live, submit the form on /2027 rather
// than opening the URL in a browser.
