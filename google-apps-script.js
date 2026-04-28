/**
 * CALNT Technology — Google Apps Script
 * =========================================
 * This script receives lead form submissions and writes them to a Google Sheet.
 *
 * HOW TO DEPLOY:
 * 1. Go to https://sheets.google.com and create a new spreadsheet.
 *    Name it "CALNT Leads".
 *
 * 2. In the spreadsheet, click Extensions > Apps Script.
 *
 * 3. Delete the default code and paste the entire contents of THIS file.
 *
 * 4. Click Save (Ctrl+S / Cmd+S).
 *
 * 5. Click Deploy > New Deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone   ← required for the website to post to it
 *    Click Deploy → copy the Web App URL.
 *
 * 6. Paste that URL into config.js as googleSheets.scriptUrl.
 *
 * 7. On subsequent edits, use Deploy > Manage Deployments > ✏️ Edit
 *    (select "New version") and click Deploy again.
 *
 * SECURITY NOTE:
 * The Web App URL acts as a shared secret. Keep it out of public repos.
 * It is stored only in your gitignored config.js.
 */

// ---- Column headers (must match the order in appendRow below) ----
const HEADERS = [
  'Ref', 'Submitted At', 'Name', 'Email', 'Phone',
  'Property Type', 'City', 'Pincode',
  'Avg Monthly Bill', 'System Size', 'Best Time to Call'
];

// ---- Sheet name ----
const SHEET_NAME = 'Leads';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let sheet   = ss.getSheetByName(SHEET_NAME);

    // Create sheet + header row on first run
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a3a6b');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      data.ref            || '',
      data.submittedAt    || '',
      data.name           || '',
      data.email          || '',
      data.phone          || '',
      data.propertyType   || '',
      data.city           || '',
      data.pincode        || '',
      data.avgMonthlyBill || '',
      data.systemSize     || '',
      data.bestTimeToCall || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', ref: data.ref }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health-check — visit the Web App URL in a browser to confirm it's live
function doGet() {
  return ContentService
    .createTextOutput('CALNT Leads endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}
