/**
 * AskShala contact form → Google Sheet (Leads tab)
 *
 * One-time setup (run from the Apps Script editor):
 *   1. Paste this file into Extensions → Apps Script on your Leads sheet
 *   2. Run setupOneTime() once and authorise when prompted
 *   3. Copy the FORM_SECRET from the execution log into config.js on the website
 *   4. Deploy → New deployment → Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   5. Copy the Web app URL (/exec) into config.js as GOOGLE_SHEET_URL
 *
 * Security:
 *   - Write-only endpoint (no lead data is ever returned)
 *   - FORM_SECRET must match config.js (stored in Script Properties, not in this file)
 *   - Honeypot field blocks most bots
 *   - Minimum 3 seconds on page before submit
 *   - Rate limits per email and per hour
 *   - Keep the Google Sheet private to your team only
 */

var SHEET_NAME = 'Leads';
var MIN_SUBMIT_MS = 3000;
var MAX_EMAIL_PER_HOUR = 3;
var MAX_GLOBAL_PER_HOUR = 25;

var FIELD_LIMITS = {
  name: 100,
  school: 200,
  phone: 20,
  email: 254,
  message: 2000
};

var VALID_STUDENTS = {
  'under-500': true,
  '500-1000': true,
  '1000-2000': true,
  'above-2000': true
};

function doPost(e) {
  try {
    var payload = parsePayload_(e);
    assertAuthorized_(payload);
    var data = validatePayload_(payload);
    enforceRateLimits_(data.email);

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      data.name,
      data.school,
      data.phone,
      data.email,
      data.students,
      data.referral_source,
      data.message
    ]);

    return jsonResponse_({ success: true });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: publicErrorMessage_(error)
    });
  }
}

function doGet() {
  return jsonResponse_({ status: 'ok' });
}

function setupOneTime() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('FORM_SECRET');

  if (!secret) {
    secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('FORM_SECRET', secret);
  }

  ensureHeaders_();

  Logger.log('AskShala form setup complete.');
  Logger.log('Copy this FORM_SECRET into website config.js:');
  Logger.log(secret);
  Logger.log('Then deploy the web app and paste the /exec URL into GOOGLE_SHEET_URL.');
}

function parsePayload_(e) {
  var p = e.parameter || {};
  var body = {};

  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      body = {};
    }
  }

  return {
    token: String(p.token || body.token || ''),
    form_loaded_at: Number(p.form_loaded_at || body.form_loaded_at || 0),
    company_website: String(p.company_website || body.company_website || ''),
    name: String(p.name || body.name || ''),
    school: String(p.school || body.school || ''),
    phone: String(p.phone || body.phone || ''),
    email: String(p.email || body.email || ''),
    students: String(p.students || body.students || ''),
    referral_source: String(p.referral_source || body.referral_source || ''),
    message: String(p.message || body.message || '')
  };
}

function assertAuthorized_(payload) {
  var expected = PropertiesService.getScriptProperties().getProperty('FORM_SECRET');

  if (!expected) {
    throw new Error('SETUP_REQUIRED');
  }

  if (!payload.token || payload.token !== expected) {
    throw new Error('AUTH_FAILED');
  }

  if (payload.company_website) {
    throw new Error('BOT_BLOCKED');
  }

  var elapsed = Date.now() - payload.form_loaded_at;
  if (!payload.form_loaded_at || elapsed < MIN_SUBMIT_MS) {
    throw new Error('TOO_FAST');
  }
}

function validatePayload_(payload) {
  var data = {
    name: trimAndLimit_(payload.name, FIELD_LIMITS.name),
    school: trimAndLimit_(payload.school, FIELD_LIMITS.school),
    phone: trimAndLimit_(payload.phone, FIELD_LIMITS.phone),
    email: trimAndLimit_(payload.email, FIELD_LIMITS.email).toLowerCase(),
    students: payload.students,
    referral_source: trimAndLimit_(payload.referral_source, 100),
    message: trimAndLimit_(payload.message, FIELD_LIMITS.message)
  };

  if (!data.name) throw new Error('INVALID_NAME');
  if (!data.school) throw new Error('INVALID_SCHOOL');
  if (!data.phone || data.phone.replace(/\D/g, '').length < 10) throw new Error('INVALID_PHONE');
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('INVALID_EMAIL');
  if (!VALID_STUDENTS[data.students]) throw new Error('INVALID_STUDENTS');

  return data;
}

function enforceRateLimits_(email) {
  var cache = CacheService.getScriptCache();
  var emailKey = 'email_' + Utilities.base64EncodeWebSafe(email).slice(0, 64);
  var emailCount = parseInt(cache.get(emailKey) || '0', 10);

  if (emailCount >= MAX_EMAIL_PER_HOUR) {
    throw new Error('RATE_LIMIT');
  }

  cache.put(emailKey, String(emailCount + 1), 3600);

  var globalKey = 'global_hour';
  var globalCount = parseInt(cache.get(globalKey) || '0', 10);

  if (globalCount >= MAX_GLOBAL_PER_HOUR) {
    throw new Error('RATE_LIMIT');
  }

  cache.put(globalKey, String(globalCount + 1), 3600);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('SHEET_NOT_FOUND');
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  var target = sheet || getSheetByNameOrFirst_();

  if (target.getLastRow() === 0) {
    target.appendRow([
      'Timestamp',
      'Name',
      'School',
      'Phone',
      'Email',
      'Students',
      'Referral',
      'Message'
    ]);
    return;
  }

  var headers = target.getRange(1, 1, 1, 8).getValues()[0];
  var expected = ['Timestamp', 'Name', 'School', 'Phone', 'Email', 'Students', 'Referral', 'Message'];
  var matches = headers.join('|') === expected.join('|');

  if (!matches) {
    target.insertRowBefore(1);
    target.getRange(1, 1, 1, 8).setValues([expected]);
  }
}

function getSheetByNameOrFirst_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  return sheet || ss.getSheets()[0];
}

function trimAndLimit_(value, maxLen) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function publicErrorMessage_(error) {
  var code = error && error.message ? error.message : '';

  if (code === 'RATE_LIMIT') {
    return 'Too many requests. Please wait an hour or contact us on askshala@trilokcloud.in.';
  }

  if (code === 'INVALID_NAME' || code === 'INVALID_SCHOOL' || code === 'INVALID_PHONE' ||
      code === 'INVALID_EMAIL' || code === 'INVALID_STUDENTS') {
    return 'Please check the form fields and try again.';
  }

  if (code === 'SHEET_NOT_FOUND') {
    return 'Form is not configured yet. Please email askshala@trilokcloud.in.';
  }

  return 'Unable to submit your request right now. Please email askshala@trilokcloud.in or WhatsApp us.';
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
