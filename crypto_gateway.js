/**
 * Crypto Gateway Integration
 * Handles NOWPayments API, IPN Webhook verification, and Crypto Wallet generation.
 */
import crypto from 'crypto';

export class CryptoGateway {
  constructor(apiKey = '', ipnSecret = '', isSandbox = false) {
    this.apiKey = apiKey || process.env.NOWPAYMENTS_API_KEY || '';
    this.ipnSecret = ipnSecret || process.env.NOWPAYMENTS_IPN_SECRET || '';
    this.baseUrl = isSandbox 
      ? 'https://api-sandbox.nowpayments.io/v1' 
      : 'https://api.nowpayments.io/v1';
  }

  setCredentials(apiKey, ipnSecret, isSandbox = false) {
    this.apiKey = apiKey;
    this.ipnSecret = ipnSecret;
    this.baseUrl = isSandbox 
      ? 'https://api-sandbox.nowpayments.io/v1' 
      : 'https://api.nowpayments.io/v1';
  }

  /**
   * Whether the automatic crypto gateway (NOWPayments) has credentials set.
   * Used to hard-block creating automatic-payment orders when unconfigured.
   */
  isConfigured() {
    return Boolean(this.apiKey && String(this.apiKey).trim().length > 0);
  }

  /**
   * Check if NOWPayments API is online and key is valid
   */
  async checkStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/status`);
      const data = await res.json();
      return { ok: res.ok, status: data.message || 'online' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  /**
   * Create a crypto payment invoice via NOWPayments
   */
  async createPayment({ orderId, priceAmountUsd, payCurrency = 'usdttrc20', orderDescription, callbackUrl }) {
    if (!this.apiKey) {
      // Fallback response if user has not yet entered NOWPayments API key in admin dashboard
      return {
        success: false,
        isConfigured: false,
        error: 'NOWPAYMENTS_API_KEY is not configured in Admin Settings. Please configure in Web Admin Panel or use Manual Crypto Wallet.'
      };
    }

    try {
      const payload = {
        price_amount: Number(priceAmountUsd),
        price_currency: 'usd',
        pay_currency: payCurrency.toLowerCase().replace(/[^a-z0-9]/g, ''),
        ipn_callback_url: callbackUrl || `${process.env.APP_URL || ''}/api/webhook/nowpayments`,
        order_id: orderId,
        order_description: orderDescription || `Order ${orderId}`
      };

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          isConfigured: true,
          error: data.message || 'Failed to create NOWPayments invoice',
          raw: data
        };
      }

      return {
        success: true,
        paymentId: String(data.payment_id),
        payAddress: data.pay_address,
        payAmount: data.pay_amount,
        payCurrency: data.pay_currency,
        paymentStatus: data.payment_status, // e.g. 'waiting'
        orderId: data.order_id,
        createdAt: data.created_at,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.pay_address)}`
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Query payment status directly from NOWPayments API
   */
  async getPaymentStatus(paymentId) {
    if (!this.apiKey || !paymentId) {
      return { success: false, error: 'Missing API key or paymentId' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentId}`, {
        headers: {
          'x-api-key': this.apiKey
        }
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.message || 'Payment not found' };
      }

      // NOWPayments statuses: 'waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'
      const isPaid = ['confirmed', 'finished'].includes(data.payment_status?.toLowerCase());
      return {
        success: true,
        isPaid,
        status: data.payment_status,
        payAmount: data.pay_amount,
        actuallyPaid: data.actually_paid,
        currency: data.pay_currency,
        orderId: data.order_id
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Verify HMAC-SHA512 Signature of NOWPayments IPN Webhook
   */
  verifyIpnSignature(rawBody, signature) {
    if (!this.ipnSecret) {
      // If secret not configured yet, cannot cryptographically verify
      return false;
    }

    try {
      const hmac = crypto.createHmac('sha512', this.ipnSecret);
      // NOWPayments requires sorted keys payload verification
      const sortedPayload = typeof rawBody === 'string' 
        ? rawBody 
        : JSON.stringify(rawBody, Object.keys(rawBody).sort());
      hmac.update(sortedPayload);
      const digest = hmac.digest('hex');
      return digest === signature;
    } catch (err) {
      console.error('IPN signature verification error:', err);
      return false;
    }
  }
}

export default new CryptoGateway();
