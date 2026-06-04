import { config } from '../config';

interface TransakWidgetParams {
  apiKey: string;
  walletAddress: string;
  network: string;
  fiatCurrency?: string;
  cryptoCurrency?: string;
  fiatAmount?: number;
  email?: string;
  redirectURL?: string;
}

export class TransakService {
  private apiKey: string;
  private environment: string;

  constructor() {
    this.apiKey = config.transak.apiKey;
    this.environment = config.transak.environment;
  }

  generateWidgetUrl(params: Omit<TransakWidgetParams, 'apiKey'>): string {
    const baseUrl = this.environment === 'PRODUCTION'
      ? 'https://global.transak.com'
      : 'https://global-stg.transak.com';

    const queryParams = new URLSearchParams({
      apiKey: this.apiKey,
      walletAddress: params.walletAddress,
      network: params.network,
    });

    if (params.fiatCurrency) queryParams.set('fiatCurrency', params.fiatCurrency);
    if (params.cryptoCurrency) queryParams.set('cryptoCurrency', params.cryptoCurrency);
    if (params.fiatAmount) queryParams.set('fiatAmount', params.fiatAmount.toString());
    if (params.email) queryParams.set('email', params.email);
    if (params.redirectURL) queryParams.set('redirectURL', params.redirectURL);

    return `${baseUrl}?${queryParams.toString()}`;
  }
}

export const transakService = new TransakService();
