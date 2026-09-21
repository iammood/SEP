// @ts-nocheck
// SEP 2026 registration handler (Brevo edition)
// Saves each submission to the Google Sheet, adds the person to a Brevo list,
// and triggers a branded transactional confirmation email from Brevo.
//
// SETUP REQUIRED (do once, see the step-by-step guide):
//   Project Settings > Script Properties, add:
//     BREVO_API_KEY        = your Brevo API key (keep secret)
//     BREVO_REG_LIST_ID    = 7
//     BREVO_REG_TEMPLATE_ID = the numeric ID of the branded confirmation template
//
// SHEET COLUMNS, left to right. Gender and Age Range were added at the far
// right so every existing column keeps its position and the Email column
// stays at 4, which isDuplicate below depends on.
//   1 Timestamp  2 First name  3 Last name  4 Email  5 Phone
//   6 Skill Track  7 How Heard  8 Gender  9 Age Range

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
    // If your tab is not named Sheet1, change the line above to its name.

    var data = JSON.parse(e.postData.contents);
    var email = (data.email || '').toString().trim().toLowerCase();

    // Guard: if this email has already registered, do not add again.
    if (email && isDuplicate(sheet, email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'already_registered' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 1) Save to the Google Sheet (unchanged, this stays the master record)
    sheet.appendRow([
      new Date(),
      data.firstName || '',
      data.lastName || '',
      data.email || '',
      data.phone || '',
      data.skillTrack || '',
      data.heardAbout || '',
      data.gender || '',
      data.ageRange || ''
    ]);

    // 2) Add to Brevo + send branded confirmation
    if (data.email) {
      addToBrevoAndConfirm(data);
    }

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

function addToBrevoAndConfirm(data) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('BREVO_API_KEY');
  var listId = parseInt(props.getProperty('BREVO_REG_LIST_ID'), 10) || 7;
  var templateId = parseInt(props.getProperty('BREVO_REG_TEMPLATE_ID'), 10);

  if (!apiKey) {
    // No key set yet, skip silently so the sheet save still succeeds.
    return;
  }

  var firstName = data.firstName || '';
  var lastName = data.lastName || '';

  // --- Step A: create/update the contact and add to the registrations list ---
  // Note: we do NOT use Brevo's SMS attribute here. SMS is strictly validated
  // (must be +234... international format) and a bad value makes Brevo reject the
  // whole contact update, including the list add. We store phone as plain text.
  //
  // Gender and Age Range are deliberately NOT sent to Brevo. Brevo rejects a
  // contact update that references an attribute which does not exist on the
  // account, and that would take the list add down with it, exactly like the
  // SMS problem above. They are recorded in the Sheet instead. To send them
  // later, create GENDER and AGE_RANGE attributes in Brevo first, then add
  // them to the attributes object below.
  try {
    var contactResp = UrlFetchApp.fetch('https://api.brevo.com/v3/contacts', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'api-key': apiKey, 'accept': 'application/json' },
      muteHttpExceptions: true,
      payload: JSON.stringify({
        email: data.email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME: lastName,
          PHONE: data.phone || '',
          SKILL_TRACK: data.skillTrack || ''
        },
        listIds: [listId],
        updateEnabled: true
      })
    });
    Logger.log('CONTACT code: ' + contactResp.getResponseCode() + ' body: ' + contactResp.getContentText());

    // If the contact already existed, updateEnabled updates attributes but may not
    // add them to the list. Force the list membership with a direct add-to-list call.
    UrlFetchApp.fetch('https://api.brevo.com/v3/contacts/lists/' + listId + '/contacts/add', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'api-key': apiKey, 'accept': 'application/json' },
      muteHttpExceptions: true,
      payload: JSON.stringify({ emails: [data.email] })
    });
  } catch (contactErr) {
    // Non-fatal, continue to the email.
  }

  // --- Step B: send the branded transactional confirmation ---
  if (templateId) {
    try {
      UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'post',
        contentType: 'application/json',
        headers: { 'api-key': apiKey, 'accept': 'application/json' },
        muteHttpExceptions: true,
        payload: JSON.stringify({
          to: [{ email: data.email, name: (firstName + ' ' + lastName).trim() }],
          templateId: templateId,
          params: { FIRSTNAME: firstName, LASTNAME: lastName }
        })
      });
    } catch (emailErr) {
      // Non-fatal.
    }
  }
}
