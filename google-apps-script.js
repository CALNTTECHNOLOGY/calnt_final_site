/**
 * CALNT Technology — Google Sheets CRM
 * ======================================
 * Captures leads from the website and manages them as a CRM in Google Sheets.
 *
 * SHEETS CREATED:
 *  • "Leads"      — every incoming lead with full CRM columns
 *  • "Dashboard"  — live summary: total leads, by status, by property type
 *
 * CRM COLUMNS (Leads sheet):
 *  Ref | Date | Name | Email | Phone | Property | City | Pincode |
 *  Monthly Bill | System Size | Status | Priority | Assigned To |
 *  Follow-up Date | Notes | Last Updated
 *
 * HOW TO DEPLOY / REDEPLOY:
 *  1. Google Sheet → Extensions → Apps Script
 *  2. Delete all existing code, paste this entire file
 *  3. Save (Cmd+S)
 *  4. Deploy → New deployment  (OR Manage deployments → Edit → New version → Deploy)
 *     Type: Web app | Execute as: Me | Access: Anyone
 *  5. Authorize all permissions when prompted (Sheet + Gmail access)
 *  6. Copy the /exec URL → config.js → googleSheets.scriptUrl
 */

// ─── Config ───────────────────────────────────────────────────────────────────
const NOTIFY_EMAIL  = 'info@calnt.com';
const LEADS_SHEET   = 'Leads';
const DASH_SHEET    = 'Dashboard';

const STATUS_OPTIONS   = ['🆕 New Lead', '📞 Contacted', '🏠 Survey Scheduled',
                          '📄 Quote Sent', '✅ Converted', '❌ Lost'];
const PRIORITY_OPTIONS = ['🔴 High', '🟡 Medium', '🟢 Low'];

const LEAD_HEADERS = [
  'Ref', 'Date & Time', 'Name', 'Email', 'Phone',
  'Property Type', 'City', 'Pincode', 'Monthly Bill', 'System Size',
  'Status', 'Priority', 'Assigned To', 'Follow-up Date', 'Notes', 'Last Updated'
];

// Column indices (1-based)
const COL = {
  ref: 1, date: 2, name: 3, email: 4, phone: 5,
  property: 6, city: 7, pincode: 8, bill: 9, size: 10,
  status: 11, priority: 12, assigned: 13, followup: 14, notes: 15, updated: 16
};

// ─── Main GET handler ─────────────────────────────────────────────────────────
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};

  // Health check (no params)
  if (!p.ref) {
    return ok({ status: 'ok', message: 'CALNT CRM endpoint is live.' });
  }

  try {
    const ss         = SpreadsheetApp.getActiveSpreadsheet();
    const leadsSheet = getOrCreateLeadsSheet(ss);
    const dashSheet  = getOrCreateDashboard(ss);

    // Append the new lead row
    const now = new Date();
    leadsSheet.appendRow([
      p.ref          || '',
      p.submittedAt  || Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy HH:mm'),
      p.name         || '',
      p.email        || '',
      p.phone        || '',
      p.propertyType || '',
      p.city         || '',
      p.pincode      || '',
      p.monthlyBill  || '',
      p.systemSize   || '',
      STATUS_OPTIONS[0],      // 🆕 New Lead
      PRIORITY_OPTIONS[1],    // 🟡 Medium
      '',                     // Assigned To — blank for manual fill
      '',                     // Follow-up Date — blank for manual fill
      '',                     // Notes — blank
      Utilities.formatDate(now, 'Asia/Kolkata', 'dd/MM/yyyy HH:mm')
    ]);

    // Style the new row
    const lastRow   = leadsSheet.getLastRow();
    styleNewLeadRow(leadsSheet, lastRow);

    // Refresh dashboard
    refreshDashboard(ss, leadsSheet, dashSheet);

    // Email notification
    sendNotificationEmail(p);

    return ok({ status: 'ok', ref: p.ref, row: lastRow });

  } catch (err) {
    Logger.log('doGet error: ' + err.message + '\n' + err.stack);
    return ok({ status: 'error', message: err.message });
  }
}

// ─── Create / initialise Leads sheet ─────────────────────────────────────────
function getOrCreateLeadsSheet(ss) {
  let sheet = ss.getSheetByName(LEADS_SHEET);
  if (sheet) return sheet;

  sheet = ss.insertSheet(LEADS_SHEET);

  // Header row
  sheet.getRange(1, 1, 1, LEAD_HEADERS.length).setValues([LEAD_HEADERS]);
  formatHeaderRow(sheet);

  // Column widths
  const widths = [110, 145, 130, 190, 120, 110, 100, 80, 110, 95, 145, 110, 120, 115, 200, 145];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // Freeze header
  sheet.setFrozenRows(1);

  // Data validation: Status dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL.status, 999).setDataValidation(statusRule);

  // Data validation: Priority dropdown
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PRIORITY_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COL.priority, 999).setDataValidation(priorityRule);

  // Conditional formatting: Status colours
  addStatusConditionalFormatting(sheet);

  return sheet;
}

// ─── Style a freshly-appended lead row ───────────────────────────────────────
function styleNewLeadRow(sheet, row) {
  const range = sheet.getRange(row, 1, 1, LEAD_HEADERS.length);

  // Alternating row shade
  const shade = (row % 2 === 0) ? '#F8FAFF' : '#FFFFFF';
  range.setBackground(shade);
  range.setVerticalAlignment('middle');
  range.setBorder(false, false, true, false, false, false,
                  '#E2E8F0', SpreadsheetApp.BorderStyle.SOLID);

  // Ref cell — bold + blue
  sheet.getRange(row, COL.ref).setFontWeight('bold').setFontColor('#1a3a6b');

  // Row height
  sheet.setRowHeight(row, 32);
}

// ─── Conditional formatting for Status column ────────────────────────────────
function addStatusConditionalFormatting(sheet) {
  const statusRange = sheet.getRange(2, COL.status, 999, 1);
  const rules = sheet.getConditionalFormatRules();

  const colours = {
    '🆕 New Lead':          { bg: '#EFF6FF', fg: '#1D4ED8' },
    '📞 Contacted':         { bg: '#FEF3C7', fg: '#92400E' },
    '🏠 Survey Scheduled':  { bg: '#ECFDF5', fg: '#065F46' },
    '📄 Quote Sent':        { bg: '#F5F3FF', fg: '#5B21B6' },
    '✅ Converted':         { bg: '#D1FAE5', fg: '#065F46' },
    '❌ Lost':              { bg: '#FEE2E2', fg: '#991B1B' }
  };

  Object.entries(colours).forEach(([label, c]) => {
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(label)
        .setBackground(c.bg)
        .setFontColor(c.fg)
        .setRanges([statusRange])
        .build()
    );
  });

  sheet.setConditionalFormatRules(rules);
}

// ─── Format header row ───────────────────────────────────────────────────────
function formatHeaderRow(sheet) {
  const hdr = sheet.getRange(1, 1, 1, LEAD_HEADERS.length);
  hdr.setBackground('#1a3a6b');
  hdr.setFontColor('#FFFFFF');
  hdr.setFontWeight('bold');
  hdr.setFontSize(11);
  hdr.setVerticalAlignment('middle');
  hdr.setWrap(false);
  sheet.setRowHeight(1, 36);
}

// ─── Dashboard sheet ─────────────────────────────────────────────────────────
function getOrCreateDashboard(ss) {
  let sheet = ss.getSheetByName(DASH_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(DASH_SHEET, 0); // first tab
    sheet.setTabColor('#1a3a6b');
  }
  return sheet;
}

function refreshDashboard(ss, leadsSheet, dashSheet) {
  const data       = leadsSheet.getDataRange().getValues();
  const rows       = data.slice(1).filter(r => r[COL.ref - 1]); // skip header, skip blanks
  const total      = rows.length;

  // Count by status
  const byStatus = {};
  STATUS_OPTIONS.forEach(s => { byStatus[s] = 0; });
  rows.forEach(r => {
    const s = r[COL.status - 1];
    if (byStatus[s] !== undefined) byStatus[s]++;
  });

  // Count by property type
  const byProp = {};
  rows.forEach(r => {
    const p = (r[COL.property - 1] || 'Unknown').toLowerCase();
    byProp[p] = (byProp[p] || 0) + 1;
  });

  dashSheet.clearContents();
  dashSheet.clearFormats();

  // ── Title
  dashSheet.getRange('A1').setValue('CALNT Technology — Leads Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor('#1a3a6b');
  dashSheet.getRange('A2').setValue('Auto-updated on every new lead')
    .setFontSize(10).setFontColor('#6B7280').setFontStyle('italic');

  // ── Total
  dashSheet.getRange('A4').setValue('Total Leads').setFontWeight('bold').setFontSize(12);
  dashSheet.getRange('B4').setValue(total).setFontSize(18).setFontWeight('bold').setFontColor('#1a3a6b');

  // ── By Status
  dashSheet.getRange('A6').setValue('BY STATUS').setFontWeight('bold').setFontColor('#6B7280').setFontSize(9);
  let row = 7;
  STATUS_OPTIONS.forEach(s => {
    dashSheet.getRange(row, 1).setValue(s);
    dashSheet.getRange(row, 2).setValue(byStatus[s] || 0).setFontWeight('bold');
    row++;
  });

  // ── By Property Type
  row += 1;
  dashSheet.getRange(row, 1).setValue('BY PROPERTY TYPE').setFontWeight('bold').setFontColor('#6B7280').setFontSize(9);
  row++;
  Object.entries(byProp).forEach(([p, count]) => {
    dashSheet.getRange(row, 1).setValue(p.charAt(0).toUpperCase() + p.slice(1));
    dashSheet.getRange(row, 2).setValue(count).setFontWeight('bold');
    row++;
  });

  // ── Last updated
  dashSheet.getRange(row + 1, 1).setValue('Last updated:')
    .setFontColor('#9CA3AF').setFontSize(9);
  dashSheet.getRange(row + 1, 2)
    .setValue(Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd/MM/yyyy HH:mm'))
    .setFontColor('#9CA3AF').setFontSize(9);

  dashSheet.setColumnWidth(1, 180);
  dashSheet.setColumnWidth(2, 80);
}

// ─── Email notification ───────────────────────────────────────────────────────
function sendNotificationEmail(p) {
  try {
    const subject = `🌞 New Solar Lead — ${p.name || 'Unknown'} · ${p.city || ''} [${p.ref || ''}]`;
    const body = [
      'New lead submitted via CALNT website.',
      '',
      '─────────────────────────────',
      `Ref:          ${p.ref || ''}`,
      `Date:         ${p.submittedAt || ''}`,
      '─────────────────────────────',
      `Name:         ${p.name || ''}`,
      `Email:        ${p.email || ''}`,
      `Phone:        ${p.phone || ''}`,
      `Property:     ${p.propertyType || ''}`,
      `City:         ${p.city || ''}`,
      `Pincode:      ${p.pincode || ''}`,
      `Monthly Bill: ${p.monthlyBill || ''}`,
      `System Size:  ${p.systemSize || ''}`,
      '─────────────────────────────',
      'Status set to: 🆕 New Lead',
      '',
      'Open your CRM sheet to update status and assign follow-up.',
      '— CALNT Website'
    ].join('\n');

    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
  } catch (err) {
    Logger.log('Email error (non-fatal): ' + err.message);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ok(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Manual trigger: run once to initialise sheets ───────────────────────────
function initialiseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateLeadsSheet(ss);
  const dash = getOrCreateDashboard(ss);
  refreshDashboard(ss, ss.getSheetByName(LEADS_SHEET), dash);
  SpreadsheetApp.getUi().alert('✅ CALNT CRM sheets initialised successfully!');
}
