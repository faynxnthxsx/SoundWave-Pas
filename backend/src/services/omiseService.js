const OMISE_API_BASE = 'https://api.omise.co';

function getSecretKey() {
  const key = (process.env.OMISE_SECRET_KEY || '').trim();
  if (!key || key.startsWith('YOUR_') || key === 'skey_test_xxx') {
    return null;
  }
  return key;
}

function getPublicKey() {
  const key = (process.env.OMISE_PUBLIC_KEY || '').trim();
  if (!key || key.startsWith('YOUR_') || key === 'pkey_test_xxx') {
    return null;
  }
  return key;
}

function isOmiseConfigured() {
  return Boolean(getSecretKey());
}

function isTestMode() {
  const key = getSecretKey();
  return Boolean(key && key.startsWith('skey_test_'));
}

function buildAuthHeader(secretKey) {
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${token}`;
}

async function omiseRequest(path, { method = 'GET', formParams = null } = {}) {
  const secretKey = getSecretKey();
  if (!secretKey) {
    const err = new Error('OMISE_NOT_CONFIGURED');
    err.code = 'OMISE_NOT_CONFIGURED';
    throw err;
  }

  const headers = {
    Authorization: buildAuthHeader(secretKey),
    Accept: 'application/json'
  };

  let body;
  if (formParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(formParams)) {
      if (v !== undefined && v !== null) {
        params.append(k, String(v));
      }
    }
    body = params.toString();
  }

  const response = await fetch(`${OMISE_API_BASE}${path}`, {
    method,
    headers,
    body
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.object === 'error') {
    const err = new Error(data.message || `Omise API error (${response.status})`);
    err.code = data.code || 'OMISE_API_ERROR';
    err.status = response.status;
    err.omiseError = data;
    throw err;
  }

  return data;
}

/**
 * Create a PromptPay QR Charge on Omise
 * @param {object} opts
 * @param {number} opts.amountTHB - Amount in Thai Baht (e.g. 1500)
 * @param {string} opts.bookingCode - Booking reference code (e.g. SW-12345)
 * @param {string} opts.bookingId - Booking UUID
 * @param {Date|string} [opts.expiresAt] - Optional expiration timestamp
 */
async function createPromptPayCharge({ amountTHB, bookingCode, bookingId, expiresAt }) {
  // Omise requires amount in satangs (smallest currency unit), minimum 2000 satangs (20 THB)
  const amountSatangs = Math.max(2000, Math.round(Number(amountTHB || 0) * 100));

  const formParams = {
    amount: amountSatangs,
    currency: 'THB',
    'source[type]': 'promptpay',
    description: `SoundWave Pass Booking ${bookingCode}`,
    'metadata[bookingCode]': bookingCode,
    'metadata[bookingId]': bookingId || ''
  };

  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (!isNaN(expDate.getTime()) && expDate.getTime() > Date.now() + 60 * 1000) {
      formParams.expires_at = expDate.toISOString();
    }
  }

  const charge = await omiseRequest('/charges', {
    method: 'POST',
    formParams
  });

  return formatChargeSummary(charge);
}

/**
 * Retrieve an existing charge from Omise
 * @param {string} chargeId
 */
async function getCharge(chargeId) {
  if (!chargeId || !String(chargeId).startsWith('chrg_')) {
    const err = new Error('Invalid Omise charge ID');
    err.code = 'INVALID_CHARGE_ID';
    throw err;
  }
  const charge = await omiseRequest(`/charges/${encodeURIComponent(chargeId)}`, {
    method: 'GET'
  });
  return formatChargeSummary(charge);
}

/**
 * Mark a test charge as paid via Omise Test API
 * Only works with skey_test_... keys on pending charges
 * @param {string} chargeId
 */
async function markTestChargeAsPaid(chargeId) {
  if (!chargeId || !String(chargeId).startsWith('chrg_test_')) {
    const err = new Error('Mark-as-paid is only supported for Omise test charges (chrg_test_...)');
    err.code = 'NOT_TEST_CHARGE';
    throw err;
  }
  const charge = await omiseRequest(`/charges/${encodeURIComponent(chargeId)}/mark_as_paid`, {
    method: 'POST'
  });
  return formatChargeSummary(charge);
}

function formatChargeSummary(charge) {
  const qrImageUrl =
    charge?.source?.scannable_code?.image?.download_uri ||
    charge?.source?.scannable_code?.image?.location ||
    null;

  return {
    id: charge.id,
    status: charge.status, // pending, successful, failed, expired, reversed
    paid: Boolean(charge.paid),
    livemode: Boolean(charge.livemode),
    amountSatangs: charge.amount,
    amountTHB: typeof charge.amount === 'number' ? charge.amount / 100 : null,
    currency: charge.currency || 'THB',
    qrImageUrl,
    expiresAt: charge.expires_at || null,
    failureCode: charge.failure_code || null,
    failureMessage: charge.failure_message || null,
    bookingCode: charge.metadata?.bookingCode || null,
    raw: charge
  };
}

module.exports = {
  isOmiseConfigured,
  isTestMode,
  getPublicKey,
  createPromptPayCharge,
  getCharge,
  markTestChargeAsPaid
};
