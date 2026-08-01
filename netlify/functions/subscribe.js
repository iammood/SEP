// Netlify serverless function — Brevo newsletter subscription
//
// Environment variables (set in Netlify → Site configuration → Environment variables):
//   BREVO_API_KEY         (required)  Your Brevo API key from brevo.com → API & Integrations
//   BREVO_LIST_ID         (optional)  Contact list ID in Brevo — defaults to 5
//   BREVO_DOI_TEMPLATE_ID (optional)  Enables full double opt-in. Set this to the numeric ID of
//                                     your Brevo DOI confirmation email template. Until it is set,
//                                     contacts are added via single opt-in (/v3/contacts).

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

  // Parse body
  let email, firstName, lastName;
  try {
    const body = JSON.parse(event.body || '{}');
    email = (body.email || '').trim().toLowerCase();
    firstName = (body.firstName || '').trim();
    lastName = (body.lastName || '').trim();
  } catch (_) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Invalid request body' }) };
  }

  // Validate email
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRe.test(email)) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'A valid email address is required' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Server configuration error' }) };
  }

  const listId = parseInt(process.env.BREVO_LIST_ID || '5', 10);
  const doiTemplateId = process.env.BREVO_DOI_TEMPLATE_ID ? parseInt(process.env.BREVO_DOI_TEMPLATE_ID, 10) : null;

  const brevoHeaders = {
    'api-key': apiKey,
    'content-type': 'application/json',
    'accept': 'application/json'
  };

  // Build optional attributes object
  const attributes = {};
  if (firstName) attributes.FIRSTNAME = firstName;
  if (lastName) attributes.LASTNAME = lastName;
  const hasAttrs = Object.keys(attributes).length > 0;

  try {
    let response;

    if (doiTemplateId) {
      // Full double opt-in — sends a confirmation email before adding to list
      response = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          email,
          ...(hasAttrs && { attributes }),
          includeListIds: [listId],
          templateId: doiTemplateId,
          redirectionUrl: 'https://seedempowermentprogram.com/?subscribed=true'
        })
      });
    } else {
      // Single opt-in fallback — adds contact directly
      // To enable full DOI, create a confirmation template in Brevo and set BREVO_DOI_TEMPLATE_ID
      response = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({
          email,
          ...(hasAttrs && { attributes }),
          listIds: [listId],
          updateEnabled: true
        })
      });
    }

    // DOI endpoint returns 204 No Content on success; contacts endpoint returns 201
    if (response.status === 204 || response.status === 201 || response.ok) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ result: 'success' }) };
    }

    let data = {};
    try { data = await response.json(); } catch (_) {}

    // "Contact already exists / already in list" → treat as success so we don't expose info
    const msg = (data.message || '').toLowerCase();
    if (data.code === 'duplicate_parameter' || msg.includes('already exists') || msg.includes('already in list') || msg.includes('contact already')) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ result: 'success' }) };
    }

    console.error('Brevo error', response.status, data);
    return {
      statusCode: response.status >= 400 && response.status < 600 ? response.status : 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ result: 'error', message: data.message || 'Subscription failed. Please try again.' })
    };

  } catch (err) {
    console.error('fetch error', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ result: 'error', message: 'Network error. Please try again.' }) };
  }
};
