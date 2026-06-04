import crypto from 'crypto';

export interface MoonpayConfig {
  apiKey: string;
  secretKey: string;
}

export interface MoonpayPurchaseParams {
  walletAddress: string;
  currencyCode?: string;
  baseCurrency?: string;
  baseCurrencyAmount?: number;
  email?: string;
  redirectUrl?: string;
}

export function createMoonpayWidgetUrl(config: MoonpayConfig, params: MoonpayPurchaseParams): string {
  const query = new URLSearchParams({
    apiKey: config.apiKey,
    walletAddress: params.walletAddress,
    currencyCode: params.currencyCode ?? 'xlm',
  });

  if (params.baseCurrency) query.set('baseCurrency', params.baseCurrency);
  if (params.baseCurrencyAmount) query.set('baseCurrencyAmount', params.baseCurrencyAmount.toString());
  if (params.email) query.set('email', params.email);
  if (params.redirectUrl) query.set('redirectURL', params.redirectUrl);

  return `https://buy.moonpay.com?${query.toString()}`;
}

export function verifyMoonpayWebhook(config: MoonpayConfig, rawBody: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', config.secretKey);
  hmac.update(rawBody);
  const expected = hmac.digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function getMoonpayBuyQuote(config: MoonpayConfig, params: {
  baseCurrency: string;
  baseCurrencyAmount: number;
  quoteCurrency: string;
}): Promise<{
  quoteCurrencyAmount: number;
  feeAmount: number;
  totalAmount: number;
}> {
  const url = `https://api.moonpay.com/v3/currencies/${params.quoteCurrency}/buy_quote`;
  const query = new URLSearchParams({
    apiKey: config.apiKey,
    baseCurrencyAmount: params.baseCurrencyAmount.toString(),
    baseCurrency: params.baseCurrency,
    areFeesIncluded: 'true',
  });
  const res = await fetch(`${url}?${query.toString()}`);
  if (!res.ok) throw new Error(`moonpay quote failed: ${res.statusText}`);
  const data = await res.json();
  return {
    quoteCurrencyAmount: data.quoteCurrencyAmount,
    feeAmount: data.feeAmount,
    totalAmount: data.totalAmount,
  };
}
