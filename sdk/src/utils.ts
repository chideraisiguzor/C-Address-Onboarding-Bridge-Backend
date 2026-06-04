export function isValidStellarAddress(address: string): boolean {
  return /^[GC][A-Z2-7]{55}$/.test(address);
}

export function isCAddress(address: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(address);
}

export function isGAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address);
}

export function calculateFee(amount: bigint, feeBps: number): bigint {
  return (amount * BigInt(feeBps)) / BigInt(10000);
}

export function calculateReceiveAmount(amount: bigint, feeBps: number): bigint {
  return amount - calculateFee(amount, feeBps);
}

export function formatStellarAmount(amount: string): string {
  const padded = amount.padStart(8, '0');
  const intPart = padded.slice(0, -7) || '0';
  const fracPart = padded.slice(-7);
  return `${intPart}.${fracPart}`;
}
