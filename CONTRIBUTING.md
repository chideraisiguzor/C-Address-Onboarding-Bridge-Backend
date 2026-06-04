# Contributing to C-Address Onboarding Bridge

Thanks for your interest in contributing! This project is part of the Stellar Wave program, and all contributions are welcome.

## Quick Start

```bash
git clone https://github.com/C-Address-Onboarding-Bridge/C-Address-Onboarding-Bridge-Backend.git
cd C-Address-Onboarding-Bridge-Backend
npm install
cp .env.example .env
npm run build
npm run test --workspaces
```

## Good First Issues

These are scoped tasks tagged for Wave contributors:

### 🔧 Soroban Contract
- **Add `amount > 0` guard to `fund_c_address`** — `contracts/onboarding-bridge/src/lib.rs:66`. Currently the contract allows zero-value transfers. Add an `assert!(amount > 0, "amount must be positive")` guard.
- **Add Stellar asset contract integration test** — Write a Rust test that deploys the bridge, mints tokens, and calls `fund_c_address` through the Stellar asset contract wrapper to verify end-to-end funding.

### 🌐 API Server
- **Add Soroban RPC health check** — `api/src/index.ts:19`. The `/health` endpoint should also check connectivity to the Soroban RPC endpoint and report it.
- **Add `GET /api/v1/quote` caching** — Quote responses are deterministic for the same parameters. Add an in-memory cache (e.g., `node-cache`) with a 30-second TTL to reduce RPC calls.

### 📦 TypeScript SDK
- **Add pagination support to `BridgeClient`** — The SDK currently has no pagination helpers. Add a generic paginated request method.
- **Add retry logic to HTTP requests** — The `request()` method in `sdk/src/bridge.ts` should retry on network failures (up to 3 attempts with exponential backoff).

### 📝 Documentation
- **Add JSDoc comments to SDK** — All public methods in `BridgeClient` need JSDoc with `@param` and `@returns` tags.
- **Write a wallet integration guide** — Create `docs/wallet-integration.md` showing how wallets integrate the SDK to support C-address funding flows.

## Wave Contribution Flow

1. Comment on the issue you want to work on
2. Fork the repo and create a feature branch
3. Write tests for your changes
4. Run `npm run test --workspaces` to verify
5. Run `npm run build` to verify compilation
6. Open a pull request with a clear description

## Code Standards

- TypeScript: `strict: true`, no `any` types
- Rust: `#![no_std]`, `require_auth()` on all privileged functions
- Tests: all new features must include tests
- API: Zod schemas for all request validation
- Commits: conventional commits (`feat:`, `fix:`, `docs:`, `test:`)

## Need Help?

Join the [Stellar Wave Discord](https://discord.gg/stellar-wave) and ask in the `#c-address-bridge` channel.
