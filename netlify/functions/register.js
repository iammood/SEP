// Netlify serverless function — SEP 2026 registration relay
//
// Why this exists: the browser used to POST straight to script.google.com.
// Chrome's Safe Browsing check reads "form collects personal details, sends
// them to a third-party domain, no visible form action" as a phishing pattern
// and shows a warning on the site. Relaying through this function makes the
// browser's request same-origin, so the pattern no longer matches.
//
// The browser talks to /.netlify/functions/register. Only this file talks to
// Google. Nothing about the Apps Script itself changed.
//
// Optional environment variable (Netlify → Site configuration → Environment
// variables): REG_ENDPOINT overrides the default below, useful if the Apps
// Script is redeployed and gets a new /exec URL.

// The registration Apps Script Web App. Moved here from js/main.js.
// If you redeploy that script, paste the new /exec URL here.
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyP0sMkxCmzmNqnZ0H_0UeZrEIVeINoDjnxi7NH7xyHwhM_LvjT2gtMs5DGb6dbriNc9A/exec';

// Netlify cuts a function off at 10 seconds and returns its own error page,
// which is HTML. Give up just before that so the browser always gets JSON.
//
// Measured against the live script: a warm Apps Script answers in 2 to 4
// seconds, but the first call after it has been idle can take longer than
// this and still write the row. When that happens the browser sees an error,
// the retry in js/main.js re-sends, and the now warm script answers
// already_registered, which the site shows as "You are already registered".
// The seat is genuinely saved, so the message is accurate.
const TIMEOUT_MS = 9000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async function (event) {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Method not allowed' }) };
  }

  // Parse body. The browser sends text/plain, so read event.body directly
  // rather than trusting a content type.
  let firstName, lastName, email, phone, gender, ageRange, skillTrack, heardAbout;
  try {
    const body = JSON.parse(event.body || '{}');
    firstName  = String(body.firstName  || '').trim();
    lastName   = String(body.lastName   || '').trim();
    email      = String(body.email      || '').trim();
    phone      = String(body.phone      || '').trim();
    gender     = String(body.gender     || '').trim();
    ageRange   = String(body.ageRange   || '').trim();
    skillTrack = String(body.skillTrack || '').trim();
    heardAbout = String(body.heardAbout || '').trim();
  } catch (_) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Invalid request body' }) };
  }

  // The Apps Script matches on email, so a blank one would write a junk row
  // that can never be de-duplicated.
  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'A valid email address is required' }) };
  }

  const appsScriptUrl = process.env.REG_ENDPOINT || DEFAULT_APPS_SCRIPT_URL;

  // Rebuild the payload from the eight known fields. Forwarding event.body
  // as-is would let anyone use this function to post anything they like to
  // the Google endpoint.
  //
  // gender and ageRange are passed through but not required here. The form
  // requires them, and leaving the check in one place means an older cached
  // copy of js/main.js can still register someone rather than failing.
  const payload = JSON.stringify({ firstName, lastName, email, phone, gender, ageRange, skillTrack, heardAbout });

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

  try {
    // text/plain matches what the browser used to send, which is what the
    // Apps Script reads in e.postData.contents.
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      signal: controller.signal
    });

    const text = await response.text();

    // Pass the Apps Script answer straight back, unchanged.
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // Apps Script sometimes answers the redirect hop with an HTML error page
      // instead of JSON. Return readable JSON so the retry in js/main.js can
      // see a bad result and re-send, rather than choking on HTML.
      console.error('Registration: non-JSON response from Apps Script', response.status, text.slice(0, 300));
      return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Unexpected response from the registration service' }) };
    }

    if (data.result === 'error') {
      console.error('Registration: Apps Script returned an error', data.message);
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Registration: Apps Script timed out after ' + TIMEOUT_MS + 'ms');
      return { statusCode: 504, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'The registration service took too long to answer. Please try again.' }) };
    }
    console.error('Registration: fetch error', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Network error. Please try again.' }) };

  } finally {
    clearTimeout(timer);
  }
};
