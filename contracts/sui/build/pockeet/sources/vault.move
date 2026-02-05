module pockeet::vault;

use sui::coin::{Self, Coin};
use sui::balance::{Self, Balance};
use sui::table::{Self, Table};
use sui::event;

// === Errors ===

const EInsufficientBalance: u64 = 0;
const EInvalidAmount: u64 = 1;
const EVaultPaused: u64 = 3;

// === Structs ===

/// Main vault structure for storing assets
public struct Vault<phantom T> has key {
    id: UID,
    /// User balances mapping
    balances: Table<address, u64>,
    /// Total amount deposited across all users
    total_deposited: u64,
    /// Total yield earned
    yield_balance: u64,
    /// Vault reserve
    reserve: Balance<T>,
    /// Is vault paused
    paused: bool,
    /// Vault version for upgrades
    version: u64,
}

/// Admin capability for vault management
public struct VaultAdminCap has key, store {
    id: UID,
}

// === Events ===

public struct DepositEvent has copy, drop {
    user: address,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

public struct WithdrawEvent has copy, drop {
    user: address,
    amount: u64,
    new_balance: u64,
    timestamp: u64,
}

public struct YieldEarnedEvent has copy, drop {
    strategy: vector<u8>,
    amount: u64,
    timestamp: u64,
}

public struct VaultPausedEvent has copy, drop {
    paused: bool,
    timestamp: u64,
}

// === Public Functions ===

/// Module initializer - creates and transfers admin capability
fun init(ctx: &mut TxContext) {
    let admin_cap = VaultAdminCap {
        id: object::new(ctx),
    };
    transfer::transfer(admin_cap, ctx.sender());
}

/// Creates and shares a new vault
public fun create_vault<T>(_admin: &VaultAdminCap, ctx: &mut TxContext) {
    let vault = Vault<T> {
        id: object::new(ctx),
        balances: table::new(ctx),
        total_deposited: 0,
        yield_balance: 0,
        reserve: balance::zero(),
        paused: false,
        version: 1,
    };
    transfer::share_object(vault);
}

/// Deposits coins to vault
public fun deposit<T>(
    vault: &mut Vault<T>,
    payment: Coin<T>,
    ctx: &mut TxContext
) {
    assert!(!vault.paused, EVaultPaused);
    
    let amount = payment.value();
    assert!(amount > 0, EInvalidAmount);

    let depositor = ctx.sender();
    let timestamp = ctx.epoch_timestamp_ms();

    // Update user balance
    if (vault.balances.contains(depositor)) {
        let balance = &mut vault.balances[depositor];
        *balance = *balance + amount;
    } else {
        vault.balances.add(depositor, amount);
    };

    // Add to reserve
    let coin_balance = payment.into_balance();
    vault.reserve.join(coin_balance);
    vault.total_deposited = vault.total_deposited + amount;

    // Get new balance
    let new_balance = vault.balances[depositor];

    event::emit(DepositEvent {
        user: depositor,
        amount,
        new_balance,
        timestamp,
    });
}

/// Withdraws coins from vault
public fun withdraw<T>(
    vault: &mut Vault<T>,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(!vault.paused, EVaultPaused);
    assert!(amount > 0, EInvalidAmount);

    let withdrawer = ctx.sender();
    let timestamp = ctx.epoch_timestamp_ms();
    
    assert!(vault.balances.contains(withdrawer), EInsufficientBalance);
    let balance = &mut vault.balances[withdrawer];
    assert!(*balance >= amount, EInsufficientBalance);

    // Update user balance
    *balance = *balance - amount;
    let new_balance = *balance;

    // Withdraw from reserve
    let withdrawn = vault.reserve.split(amount);
    let coin = coin::from_balance(withdrawn, ctx);
    transfer::public_transfer(coin, withdrawer);

    vault.total_deposited = vault.total_deposited - amount;

    event::emit(WithdrawEvent {
        user: withdrawer,
        amount,
        new_balance,
        timestamp,
    });
}

/// Adds yield from strategies (called by authorized contracts)
public fun add_yield<T>(
    vault: &mut Vault<T>,
    yield_payment: Coin<T>,
    strategy_name: vector<u8>,
    ctx: &mut TxContext
) {
    let amount = yield_payment.value();
    let yield_balance = yield_payment.into_balance();
    
    vault.reserve.join(yield_balance);
    vault.yield_balance = vault.yield_balance + amount;

    event::emit(YieldEarnedEvent {
        strategy: strategy_name,
        amount,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

// === Admin Functions ===

/// Pauses or unpauses vault (admin only)
public fun admin_set_paused<T>(
    _admin: &VaultAdminCap,
    vault: &mut Vault<T>,
    paused: bool,
    ctx: &mut TxContext
) {
    vault.paused = paused;
    
    event::emit(VaultPausedEvent {
        paused,
        timestamp: ctx.epoch_timestamp_ms(),
    });
}

/// Emergency withdraw (admin only, when paused)
public fun admin_emergency_withdraw<T>(
    _admin: &VaultAdminCap,
    vault: &mut Vault<T>,
    recipient: address,
    amount: u64,
    ctx: &mut TxContext
) {
    assert!(vault.paused, EVaultPaused);
    
    let withdrawn = vault.reserve.split(amount);
    let coin = coin::from_balance(withdrawn, ctx);
    transfer::public_transfer(coin, recipient);
}

// === View Functions ===

/// Returns user balance in vault
public fun balance<T>(vault: &Vault<T>, user: address): u64 {
    if (vault.balances.contains(user)) {
        vault.balances[user]
    } else {
        0
    }
}

/// Returns total deposited in vault
public fun total_deposited<T>(vault: &Vault<T>): u64 {
    vault.total_deposited
}

/// Returns total yield earned
public fun yield_earned<T>(vault: &Vault<T>): u64 {
    vault.yield_balance
}

/// Returns vault reserve balance
public fun reserve_balance<T>(vault: &Vault<T>): u64 {
    vault.reserve.value()
}

/// Checks if vault is paused
public fun is_paused<T>(vault: &Vault<T>): bool {
    vault.paused
}

/// Returns vault version
public fun version<T>(vault: &Vault<T>): u64 {
    vault.version
}

// === Test Functions ===

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

#[test_only]
public fun create_vault_for_testing<T>(ctx: &mut TxContext): VaultAdminCap {
    let admin_cap = VaultAdminCap {
        id: object::new(ctx),
    };
    
    let vault = Vault<T> {
        id: object::new(ctx),
        balances: table::new(ctx),
        total_deposited: 0,
        yield_balance: 0,
        reserve: balance::zero(),
        paused: false,
        version: 1,
    };
    
    transfer::share_object(vault);
    admin_cap
}
