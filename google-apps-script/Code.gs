/**
 * Octohood allowlist storage. Paste this into the sheet's Apps Script editor
 * (Extensions → Apps Script), then:
 *
 * 1. Deploy → New deployment → type "Web app".
 *    Execute as: Me. Who has access: Anyone.
 * 2. Copy the web app URL (ends in /exec) into the site's SHEET_SCRIPT_URL.
 *
 * There's no secret: anyone with the URL can read the rows and append one, skipping the site's
 * checks. Keep the URL private (server env vars only, never in client code).
 *
 * After editing this file, use Deploy → Manage deployments → edit → Version: New version,
 * so the same URL serves the new code.
 */

var TAB = 'Allowlist';
var COLUMNS = ['wallet', 'x_handle', 'x_id', 'quote_url', 'reply_url', 'time_ms', 'restarts', 'restart_posts', 'joined_at'];

/** GET → { rows: [[wallet, x_handle, ...], ...] } (header left out). */
function doGet() {
  return json({ rows: readRows(sheet()) });
}

/** POST { row: [...COLUMNS] } → { ok: true } or { error: 'duplicate', message }. */
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ error: 'bad_request' });
  }
  var row = body.row;
  if (!Array.isArray(row) || row.length !== COLUMNS.length || !/^0x[a-f0-9]{40}$/.test(row[0])) {
    return json({ error: 'bad_request' });
  }
  row = row.map(String);

  // One write at a time, so two quick joins can't both claim the same wallet or X account.
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet();
    var rows = readRows(sh);
    var wallet = row[0], handle = row[1].toLowerCase(), xId = row[2];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0].toLowerCase() === wallet) {
        return json({ error: 'duplicate', message: 'That wallet is already in the hood.' });
      }
      if ((xId && rows[i][2] === xId) || rows[i][1].toLowerCase() === handle) {
        return json({ error: 'duplicate', message: '@' + row[1] + ' already lives in the hood.' });
      }
    }
    sh.appendRow(row);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** The Allowlist tab, created with a header row and plain-text columns on first use. */
function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB);
  if (!sh) sh = ss.insertSheet(TAB);
  if (sh.getLastRow() === 0) {
    // Plain text, so wallets, ids and timestamps aren't turned into numbers or dates.
    sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).setNumberFormat('@');
    sh.appendRow(COLUMNS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function readRows(sh) {
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, COLUMNS.length).getDisplayValues();
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
