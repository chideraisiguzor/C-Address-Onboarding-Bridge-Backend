import { describe, it, expect } from 'vitest';
import { BridgeClient } from '../src/bridge';
import { calculateFee, calculateReceiveAmount, isValidStellarAddress, isCAddress, isGAddress } from '../src/utils';

const VALID_C_ADDR = 'CABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';
const VALID_G_ADDR = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';

describe('BridgeClient', () => {
  it('creates a client with base url', () => {
    const client = new BridgeClient({ baseUrl: 'http://localhost:3001' });
    expect(client).toBeInstanceOf(BridgeClient);
  });

  it('normalizes trailing slash in base url', () => {
    const client = new BridgeClient({ baseUrl: 'http://localhost:3001/' });
    expect(client).toBeInstanceOf(BridgeClient);
  });

  it('creates a client with api key', () => {
    const client = new BridgeClient({ baseUrl: 'http://localhost:3001', apiKey: 'test-key' });
    expect(client).toBeInstanceOf(BridgeClient);
  });
});

describe('Utils', () => {
  it('calculates fee correctly', () => {
    expect(calculateFee(1000n, 100)).toBe(10n);
    expect(calculateFee(1000n, 0)).toBe(0n);
    expect(calculateFee(10000n, 50)).toBe(50n);
  });

  it('calculates receive amount correctly', () => {
    expect(calculateReceiveAmount(1000n, 100)).toBe(990n);
    expect(calculateReceiveAmount(1000n, 0)).toBe(1000n);
  });

  it('validates stellar addresses', () => {
    expect(isValidStellarAddress(VALID_C_ADDR)).toBe(true);
    expect(isValidStellarAddress(VALID_G_ADDR)).toBe(true);
    expect(isValidStellarAddress('not-an-address')).toBe(false);
    expect(isValidStellarAddress('')).toBe(false);
    expect(isValidStellarAddress('G7QJ2X2L7U')).toBe(false);
  });

  it('distinguishes C vs G addresses', () => {
    expect(isCAddress(VALID_C_ADDR)).toBe(true);
    expect(isCAddress(VALID_G_ADDR)).toBe(false);
    expect(isGAddress(VALID_G_ADDR)).toBe(true);
    expect(isGAddress(VALID_C_ADDR)).toBe(false);
  });
});
