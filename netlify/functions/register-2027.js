// Netlify serverless function: SEP 2027 early interest relay
//
// Copy of register.js for the SEP 2027 early interest list on 2027.html.
// Same reason it exists: the browser posts to our own site, and only this
// file talks to Google, so Chrome's Safe Browsing check does not read the
// form as phishing.
//
// The browser talks to /.netlify/functions/register-2027. This file forwards
// the submission to the register-2027.gs Apps Script, which writes to its own
// Google Sheet. It never touches the SEP 2026 registration Sheet.
//
// Required environment variable (Netlify → Site configuration → Environment
// variables): SEP_2027_SCRIPT_URL, the /exec URL of the deployed
// register-2027.gs Web App. Unlike register.js there is no default URL in
// this file, so if the variable is missing every submit fails with an error
// message rather than going somewhere unexpected.

// Netlify cuts a function off at 10 seconds and returns its own error page,
// which is HTML. Give up just before that so the browser always gets JSON.
// See register.js for the measured Apps Script timings behind this number.
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
  let firstName, lastName, email, phone, gender, ageRange, heardAbout;
  try {
    const body = JSON.parse(event.body || '{}');
    firstName  = String(body.firstName  || '').trim();
    lastName   = String(body.lastName   || '').trim();
    email      = String(body.email      || '').trim();
    phone      = String(body.phone      || '').trim();
    gender     = String(body.gender     || '').trim();
    ageRange   = String(body.ageRange   || '').trim();
    heardAbout = String(body.heardAbout || '').trim();
  } catch (_) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Invalid request body' }) };
  }

  // The Apps Script matches on email, so a blank one would write a junk row
  // that can never be de-duplicated.
  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'A valid email address is required' }) };
  }

  const appsScriptUrl = process.env.SEP_2027_SCRIPT_URL;
  if (!appsScriptUrl) {
    console.error('SEP 2027 interest: SEP_2027_SCRIPT_URL is not set in Netlify');
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'The interest list is not connected yet' }) };
  }

  // Rebuild the payload from the seven known fields. Forwarding event.body
  // as-is would let anyone use this function to post anything they like to
  // the Google endpoint.
  const payload = JSON.stringify({ firstName, lastName, email, phone, gender, ageRange, heardAbout });

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);

  try {
    // text/plain is what the Apps Script reads in e.postData.contents.
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
      console.error('SEP 2027 interest: non-JSON response from Apps Script', response.status, text.slice(0, 300));
      return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Unexpected response from the interest list service' }) };
    }

    if (data.result === 'error') {
      console.error('SEP 2027 interest: Apps Script returned an error', data.message);
    }

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('SEP 2027 interest: Apps Script timed out after ' + TIMEOUT_MS + 'ms');
      return { statusCode: 504, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'The interest list service took too long to answer. Please try again.' }) };
    }
    console.error('SEP 2027 interest: fetch error', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Network error. Please try again.' }) };

  } finally {
    clearTimeout(timer);
  }
};
