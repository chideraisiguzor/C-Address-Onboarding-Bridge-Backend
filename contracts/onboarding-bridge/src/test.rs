#![cfg(test)]

use soroban_sdk::{
    contract, contractimpl, contracttype, testutils::Address as _, testutils::Ledger as _,
    Address, Env, String,
};

use super::*;

// ---------------------------------------------------------------------------
// Minimal test token (accounting only)
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
enum TK {
    Bal(Address),
}

#[contract]
struct TestToken;

#[contractimpl]
impl TestToken {
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        let fb: i128 = env
            .storage()
            .persistent()
            .get::<TK, i128>(&TK::Bal(from.clone()))
            .unwrap_or(0);
        let tb: i128 = env
            .storage()
            .persistent()
            .get::<TK, i128>(&TK::Bal(to.clone()))
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&TK::Bal(from), &(fb - amount));
        env.storage()
            .persistent()
            .set(&TK::Bal(to), &(tb + amount));
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage()
            .persistent()
            .get::<TK, i128>(&TK::Bal(id))
            .unwrap_or(0)
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let b: i128 = env
            .storage()
            .persistent()
            .get::<TK, i128>(&TK::Bal(to.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(&TK::Bal(to), &(b + amount));
    }

    pub fn decimals(_env: Env) -> u32 { 7 }
    pub fn name(env: Env) -> String { String::from_str(&env, "TestToken") }
    pub fn symbol(env: Env) -> String { String::from_str(&env, "TEST") }
    pub fn allowance(_env: Env, _from: Address, _spender: Address) -> i128 { i128::MAX }
    pub fn approve(_env: Env, _from: Address, _spender: Address, _amount: i128, _exp: u32) {}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

struct S {
    env: Env,
    bridge: OnboardingBridgeClient<'static>,
    token: TestTokenClient<'static>,
    admin: Address,
}

fn setup(fee_bps: u32, delay: u64) -> S {
    let env = Env::default();
    env.mock_all_auths_allowing_non_root_auth();
    let bridge_id = env.register_contract(None, OnboardingBridge);
    let token_id = env.register_contract(None, TestToken);
    let bridge = OnboardingBridgeClient::new(&env, &bridge_id);
    let token = TestTokenClient::new(&env, &token_id);
    let admin = Address::generate(&env);
    bridge.initialize(&admin, &fee_bps, &delay);
    S { env, bridge, token, admin }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

#[test]
fn test_initialize() {
    let s = setup(30, 0);
    assert_eq!(s.bridge.admin(), s.admin);
    assert_eq!(s.bridge.fee_bps(), 30);
    assert_eq!(s.bridge.version(), 2);
    assert_eq!(s.bridge.timelock_delay(), 0);
    assert!(!s.bridge.is_paused());
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialize() {
    let s = setup(30, 0);
    let a2 = Address::generate(&s.env);
    s.bridge.initialize(&a2, &50, &0);
}

// ---------------------------------------------------------------------------
// Timelock
// ---------------------------------------------------------------------------

#[test]
fn test_propose_and_read() {
    let s = setup(30, 0);
    let label = String::from_str(&s.env, "set_fee:50");
    let (hash, ready_at) = s.bridge.propose_op(&label);
    assert!(ready_at >= s.env.ledger().timestamp());
    let op = s.bridge.pending_op(&hash).unwrap();
    assert!(!op.cancelled);
    assert_eq!(op.ready_at, ready_at);
}

#[test]
fn test_cancel_op() {
    let s = setup(30, 0);
    let label = String::from_str(&s.env, "cancel_test");
    let (hash, _) = s.bridge.propose_op(&label);
    s.bridge.cancel_op(&hash);
    assert!(s.bridge.pending_op(&hash).unwrap().cancelled);
}

#[test]
#[should_panic(expected = "already cancelled")]
fn test_cancel_twice_panics() {
    let s = setup(30, 0);
    let label = String::from_str(&s.env, "double_cancel");
    let (hash, _) = s.bridge.propose_op(&label);
    s.bridge.cancel_op(&hash);
    s.bridge.cancel_op(&hash);
}

#[test]
#[should_panic(expected = "timelock not elapsed")]
fn test_execute_before_delay() {
    let s = setup(30, 604800); // 7-day delay
    let label = String::from_str(&s.env, "fee_op");
    s.bridge.propose_set_fee(&label);
    s.bridge.execute_set_fee(&50, &label); // should panic
}

#[test]
fn test_execute_after_delay() {
    let s = setup(30, 100);
    let label = String::from_str(&s.env, "fee_op");
    s.bridge.propose_set_fee(&label);
    s.env.ledger().set_timestamp(s.env.ledger().timestamp() + 200);
    s.bridge.execute_set_fee(&50, &label);
    assert_eq!(s.bridge.fee_bps(), 50);
}

#[test]
#[should_panic(expected = "op cancelled")]
fn test_execute_cancelled_op() {
    let s = setup(30, 0);
    let label = String::from_str(&s.env, "cancelled_op");
    let (hash, _) = s.bridge.propose_set_fee(&label);
    s.bridge.cancel_op(&hash);
    s.bridge.execute_set_fee(&50, &label);
}

// ---------------------------------------------------------------------------
// Pause
// ---------------------------------------------------------------------------

#[test]
fn test_pause_unpause() {
    let s = setup(0, 0);
    s.bridge.pause();
    assert!(s.bridge.is_paused());
    s.bridge.unpause();
    assert!(!s.bridge.is_paused());
}

#[test]
#[should_panic(expected = "contract is paused")]
fn test_fund_while_paused() {
    let s = setup(0, 0);
    let source = Address::generate(&s.env);
    let target = Address::generate(&s.env);
    s.bridge.pause();
    let memo = String::from_str(&s.env, "test");
    s.bridge.fund_c_address(&source, &target, &s.token.address, &500, &memo);
}

// ---------------------------------------------------------------------------
// Legacy accounting tests (unchanged behaviour)
// ---------------------------------------------------------------------------

#[test]
fn test_fund_tracks_fees() {
    let s = setup(100, 0);
    let source = Address::generate(&s.env);
    let target = Address::generate(&s.env);
    let memo = String::from_str(&s.env, "test");
    let fee = s.bridge.fund_c_address(&source, &target, &s.token.address, &1000, &memo);
    assert_eq!(fee, 10);
    assert_eq!(s.bridge.accumulated_fees(), 10);
}

#[test]
fn test_withdraw_fees() {
    let s = setup(100, 0);
    let source = Address::generate(&s.env);
    let target = Address::generate(&s.env);
    let memo = String::from_str(&s.env, "test");
    s.bridge.fund_c_address(&source, &target, &s.token.address, &1000, &memo);
    let withdrawn = s.bridge.withdraw_fees(&s.admin, &s.token.address, &0);
    assert_eq!(withdrawn, 10);
    assert_eq!(s.bridge.accumulated_fees(), 0);
}
