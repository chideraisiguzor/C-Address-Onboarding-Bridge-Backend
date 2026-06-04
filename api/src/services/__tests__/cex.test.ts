import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CexRoutingService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('routes a binance withdrawal', async () => {
    const { CexRoutingService } = await import('../cex');
    const service = new CexRoutingService();
    const result = await service.routeWithdrawal({
      exchange: 'binance',
      sourceAsset: 'XLM',
      amount: '10000000',
      targetCAddress: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
      targetNetwork: 'stellar',
    });
    expect(result).toHaveProperty('withdrawalId');
    expect(result.withdrawalId).toContain('bin-');
    expect(result.status).toBe('pending');
  });

  it('routes a coinbase withdrawal', async () => {
    const { CexRoutingService } = await import('../cex');
    const service = new CexRoutingService();
    const result = await service.routeWithdrawal({
      exchange: 'coinbase',
      sourceAsset: 'USDC',
      amount: '5000000',
      targetCAddress: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
      targetNetwork: 'stellar',
    });
    expect(result.withdrawalId).toContain('cb-');
  });

  it('throws for unsupported exchange', async () => {
    const { CexRoutingService } = await import('../cex');
    const service = new CexRoutingService();
    await expect(service.routeWithdrawal({
      exchange: 'unknown' as any,
      sourceAsset: 'XLM',
      amount: '1000',
      targetCAddress: 'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW',
      targetNetwork: 'stellar',
    })).rejects.toThrow('unsupported exchange');
  });

  it('lists supported exchanges', async () => {
    const { CexRoutingService } = await import('../cex');
    const service = new CexRoutingService();
    const exchanges = service.getSupportedExchanges();
    expect(exchanges).toContain('binance');
    expect(exchanges).toContain('coinbase');
    expect(exchanges).toContain('kraken');
    expect(exchanges).toContain('generic');
  });
});
