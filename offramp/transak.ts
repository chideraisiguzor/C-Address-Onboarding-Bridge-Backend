export interface TransakConfig {
  apiKey: string;
  environment: 'STAGING' | 'PRODUCTION';
}

export interface TransakWidgetParams {
  walletAddress: string;
  network?: string;
  fiatCurrency?: string;
  cryptoCurrency?: string;
  fiatAmount?: number;
  email?: string;
  redirectUrl?: string;
  partnerFee?: number;
}

const BASE_URLS: Record<string, string> = {
  STAGING: 'https://global-stg.transak.com',
  PRODUCTION: 'https://global.transak.com',
};

export function createTransakWidgetUrl(config: TransakConfig, params: TransakWidgetParams): string {
  const baseUrl = BASE_URLS[config.environment];
  const query = new URLSearchParams({
    apiKey: config.apiKey,
    walletAddress: params.walletAddress,
    network: params.network ?? 'stellar',
  });

  if (params.fiatCurrency) query.set('fiatCurrency', params.fiatCurrency);
  if (params.cryptoCurrency) query.set('cryptoCurrency', params.cryptoCurrency);
  if (params.fiatAmount) query.set('fiatAmount', params.fiatAmount.toString());
  if (params.email) query.set('email', params.email);
  if (params.redirectUrl) query.set('redirectURL', params.redirectUrl);
  if (params.partnerFee) query.set('partnerFee', params.partnerFee.toString());

  query.set('themeColor', '#7C3AED');

  return `${baseUrl}?${query.toString()}`;
}
