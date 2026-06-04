import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SorobanService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns a quote with fee calculation', async () => {
    process.env.SOROBAN_RPC_URL = 'https://soroban-rpc.testnet.stellar.org';
    process.env.BRIDGE_FEE_BPS = '30';
    const { SorobanService } = await import('../soroban');
    const service = new SorobanService();
    const quote = await service.getQuote('XLM', '1000', 'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW');
    expect(quote).toHaveProperty('estimatedFee');
    expect(quote).toHaveProperty('expectedReceive');
    expect(quote).toHaveProperty('feeBps');
    expect(quote.feeBps).toBe(30);
    expect(quote.estimatedFee).toBe('3');
    expect(quote.expectedReceive).toBe('997');
  });

  it('returns zero fee when fee is zero', async () => {
    process.env.SOROBAN_RPC_URL = 'https://soroban-rpc.testnet.stellar.org';
    process.env.BRIDGE_FEE_BPS = '0';
    const { SorobanService } = await import('../soroban');
    const zeroService = new SorobanService();
    const quote = await zeroService.getQuote('XLM', '1000', 'C...');
    expect(quote.estimatedFee).toBe('0');
    expect(quote.expectedReceive).toBe('1000');
  });
});
