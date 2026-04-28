/**
 * CALNT Technology — Google Apps Script
 * =========================================
 * Receives lead form submissions and writes them to a Google Sheet.
 *
 * HOW TO DEPLOY (or RE-DEPLOY after editing):
 * 1. In your Google Sheet → Extensions → Apps Script
 * 2. Replace ALL existing code with this file's contents
 * 3. Click Save (Cmd+S)
 * 4. Click Deploy → New deployment (or Manage deployments → edit existing)
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Click Deploy → Authorize → Allow
 * 6. Copy the /exec URL → paste into config.js as googleSheets.scriptUrl
 *
 * IMPORTANT — after ANY code change you must create a new version:
 *   Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy
 *   (Changes do NOT take effect until you deploy a new version)
 */

const SHEET_NAME = 'Leads';

const HEADERS = [
  'Ref', 'Submitted At', 'Name', 'Email', 'Phone',
  'Property Type', 'City', 'Pincode',
  'Avg Monthly Bill', 'System Size', 'Best Time to Call'
];

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setValues([HEADERS]);
    hdr.setFontWeight('bold');
    hdr.setBackground('#1a3a6b');
    hdr.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 130);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 180);
  }
  return sheet;
}

// ---- Main handler: GET request with URL params (used by website) ----
function doGet(e) {
  try {
    const p = e.parameter;
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      p.ref          || '',
      p.submittedAt  || '',
      p.name         || '',
      p.email        || '',
      p.phone        || '',
      p.propertyType || '',
      p.city         || '',
      p.pincode      || '',
      p.monthlyBill  || '',
      p.systemSize   || '',
      p.bestTime     || ''
    ]);

    // Send email notification via Gmail
    try {
      MailApp.sendEmail({
        to: 'info@calnt.com',
        subject: 'New Solar Lead — ' + (p.name || 'Unknown') + ' (' + (p.city || '') + ') [' + (p.ref || '') + ']',
        body: [
          'New lead submitted via CALNT website.',
          '',
          'Ref:           ' + (p.ref || ''),
          'Submitted:     ' + (p.submittedAt || ''),
          '',
          'Name:          ' + (p.name || ''),
          'Email:         ' + (p.email || ''),
          'Phone:         ' + (p.phone || ''),
          'Property:      ' + (p.propertyType || ''),
          'City:          ' + (p.city || ''),
          'Pincode:       ' + (p.pincode || ''),
          'Monthly Bill:  ' + (p.monthlyBill || ''),
          'System Size:   ' + (p.systemSize || ''),
          'Best Time:     ' + (p.bestTime || ''),
          '',
          '— CALNT Website'
        ].join('\n')
      });
    } catch (mailErr) {
      // Email failed but sheet write succeeded — log and continue
      Logger.log('Mail error: ' + mailErr.message);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', ref: p.ref }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doGet error: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- Backup: POST handler (kept for compatibility) ----
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      data.ref || '', data.submittedAt || '', data.name || '',
      data.email || '', data.phone || '', data.propertyType || '',
      data.city || '', data.pincode || '', data.avgMonthlyBill || '',
      data.systemSize || '', data.bestTimeToCall || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
