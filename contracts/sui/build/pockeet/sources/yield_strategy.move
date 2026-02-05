module pockeet::yield_strategy;

use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::table::{Self, Table};
use sui::event;

// === Errors ===

const EInsufficientBalance: u64 = 0;
const EStrategyPaused: u64 = 1;
const EInvalidAmount: u64 = 2;

// === Constants ===

#[allow(unused_const)]
const STRATEGY_CONSERVATIVE: u8 = 0;
#[allow(unused_const)]
const STRATEGY_MODERATE: u8 = 1;
#[allow(unused_const)]
const STRATEGY_AGGRESSIVE: u8 = 2;

// === Structs ===

/// Yield strategy configuration
public struct YieldStrategy<phantom T> has key {
    id: UID,
    /// Strategy type
    strategy_type: u8,
    /// Total value locked in strategy
    tvl: u64,
    /// Reserve balance
    reserve: Balance<T>,
    /// User stakes
    stakes: Table<address, u64>,
    /// Is strategy paused
    paused: bool,
    /// Target APY (in basis points, e.g., 500 = 5%)
    target_apy: u64,
    /// Protocol name
    protocol: vector<u8>,
}

/// Admin capability
public struct StrategyAdminCap has key, store {
    id: UID,
}

// === Events ===

public struct StakeEvent has copy, drop {
    user: address,
    amount: u64,
    strategy_type: u8,
    timestamp: u64,
}

public struct UnstakeEvent has copy, drop {
    user: address,
    amount: u64,
    timestamp: u64,
}

public struct YieldDistributedEvent has copy, drop {
    total_yield: u64,
    timestamp: u64,
}

// === Public Functions ===

/// Module initializer
fun init(ctx: &mut TxContext) {
    let admin_cap = StrategyAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

/// Creates and shares a new yield strategy
public fun create_strategy<T>(
    _admin: &StrategyAdminCap,
    strategy_type: u8,
    target_apy: u64,
    protocol: vector<u8>,
    ctx: &mut TxContext
) {
    let strategy = YieldStrategy<T> {
        id: object::new(ctx),
        strategy_type,
        tvl: 0,
        reserve: balance::zero(),
        stakes: table::new(ctx),
        paused: false,
        target_apy,
        protocol,
    };
    transfer::share_object(strategy);
}

/// Stakes coins in strategy
public fun stake<T>(
    strategy: &mut YieldStrategy<T>,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    assert!(!strategy.paused, EStrategyPaused);
    
    let amount = payment.value();
    assert!(amount > 0, EInvalidAmount);

    let staker = ctx.sender();

    // Update user stake
    if (strategy.stakes.contains(staker)) {
        let stake = &mut strategy.stakes[staker];
        *stake = *stake + amount;
    } else {
        strategy.stakes.add(staker, amount);
    };

    // Add to reserve
    let coin_balance = payment.into_balance();
    strategy.reserve.join(coin_balance);
    strategy.tvl = strategy.tvl + amount;

    event::emit(StakeEvent {
        user: staker,
        amount,
        strategy_type: strategy.strategy_type,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Unstakes coins from strategy
public fun unstake<T>(
    strategy: &mut YieldStrategy<T>,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(amount > 0, EInvalidAmount);

    let unstaker = ctx.sender();
    
    assert!(strategy.stakes.contains(unstaker), EInsufficientBalance);
    let stake = &mut strategy.stakes[unstaker];
    assert!(*stake >= amount, EInsufficientBalance);

    // Update user stake
    *stake = *stake - amount;

    // Withdraw from reserve
    let withdrawn = strategy.reserve.split(amount);
    let coin = coin::from_balance(withdrawn, ctx);
    transfer::public_transfer(coin, unstaker);

    strategy.tvl = strategy.tvl - amount;

    event::emit(UnstakeEvent {
        user: unstaker,
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// === Admin Functions ===

/// Distributes yield to strategy (called by admin or automated bot)
public fun admin_distribute_yield<T>(
    _admin: &StrategyAdminCap,
    strategy: &mut YieldStrategy<T>,
    yield_payment: Coin<T>,
    ctx: &mut TxContext
) {
    let amount = yield_payment.value();
    let yield_balance = yield_payment.into_balance();
    
    strategy.reserve.join(yield_balance);

    event::emit(YieldDistributedEvent {
        total_yield: amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Pauses or unpauses strategy
public fun admin_set_paused<T>(
    _admin: &StrategyAdminCap,
    strategy: &mut YieldStrategy<T>,
    paused: bool,
    _ctx: &mut TxContext
) {
    strategy.paused = paused;
}

// === View Functions ===

/// Returns user stake in strategy
public fun stake_balance<T>(strategy: &YieldStrategy<T>, user: address): u64 {
    if (strategy.stakes.contains(user)) {
        strategy.stakes[user]
    } else {
        0
    }
}

/// Returns total value locked
public fun tvl<T>(strategy: &YieldStrategy<T>): u64 {
    strategy.tvl
}

/// Returns target APY
public fun target_apy<T>(strategy: &YieldStrategy<T>): u64 {
    strategy.target_apy
}

/// Returns strategy type
public fun strategy_type<T>(strategy: &YieldStrategy<T>): u8 {
    strategy.strategy_type
}

/// Checks if strategy is paused
public fun is_paused<T>(strategy: &YieldStrategy<T>): bool {
    strategy.paused
}

// === Test Functions ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

#[test_only]
public fun strategy_type_conservative(): u8 {
    STRATEGY_CONSERVATIVE
}

#[test_only]
public fun strategy_type_moderate(): u8 {
    STRATEGY_MODERATE
}

#[test_only]
public fun strategy_type_aggressive(): u8 {
    STRATEGY_AGGRESSIVE
}
