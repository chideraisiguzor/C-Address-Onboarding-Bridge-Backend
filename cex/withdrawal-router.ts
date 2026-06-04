export interface CexConfig {
  name: string;
  apiBaseUrl: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface WithdrawalRequest {
  destinationAddress: string;
  destinationTag?: string;
  asset: string;
  amount: string;
  network: string;
}

export interface WithdrawalResult {
  success: boolean;
  withdrawalId: string;
  txHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  estimatedCompletion?: string;
}

export type WithdrawalHandler = (req: WithdrawalRequest, config: CexConfig) => Promise<WithdrawalResult>;

export class WithdrawalRouter {
  private handlers: Map<string, { config: CexConfig; handler: WithdrawalHandler }> = new Map();

  registerExchange(name: string, config: CexConfig, handler: WithdrawalHandler) {
    this.handlers.set(name.toLowerCase(), { config, handler });
  }

  async routeWithdrawal(exchange: string, request: WithdrawalRequest): Promise<WithdrawalResult> {
    const entry = this.handlers.get(exchange.toLowerCase());
    if (!entry) {
      throw new Error(`unsupported exchange: ${exchange}. supported: ${[...this.handlers.keys()].join(', ')}`);
    }
    return entry.handler(request, entry.config);
  }

  getSupportedExchanges(): string[] {
    return [...this.handlers.keys()];
  }
}

export function createCexWithdrawalMemo(targetCAddress: string, exchangeName: string): string {
  const prefix = exchangeName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const addrSuffix = targetCAddress.slice(-8);
  return `bridge:${prefix}:${addrSuffix}`;
}

export function parseCexWithdrawalMemo(memo: string): {
  exchangeName?: string;
  targetSuffix?: string;
} {
  const parts = memo.split(':');
  if (parts.length === 3 && parts[0] === 'bridge') {
    return { exchangeName: parts[1], targetSuffix: parts[2] };
  }
  return {};
}

export const defaultCexHandlers: Record<string, WithdrawalHandler> = {
  async binance(req, _config) {
    return {
      success: true,
      withdrawalId: `bin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      estimatedCompletion: '5-30 minutes',
    };
  },

  async coinbase(req, _config) {
    return {
      success: true,
      withdrawalId: `cb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      estimatedCompletion: '5-30 minutes',
    };
  },

  async kraken(req, _config) {
    return {
      success: true,
      withdrawalId: `kr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'pending',
      estimatedCompletion: '5-30 minutes',
    };
  },
};
