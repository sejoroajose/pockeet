module pockeet::vault {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;

    // ======== Errors ========
    const EInsufficientBalance: u64 = 0;
    const EInvalidAmount: u64 = 1;
    const ENotAuthorized: u64 = 2;
    const EVaultPaused: u64 = 3;

    // ======== Structs ========
    
    /// Main vault structure for storing USDC
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

    // ======== Events ========
    
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

    // ======== Functions ========
    
    /// Module initializer
    fun init(ctx: &mut TxContext) {
        let admin_cap = VaultAdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Create a new vault
    public entry fun create_vault<T>(
        _admin: &VaultAdminCap,
        ctx: &mut TxContext
    ) {
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

    /// Deposit coins to vault
    public entry fun deposit<T>(
        vault: &mut Vault<T>,
        payment: Coin<T>,
        ctx: &mut TxContext
    ) {
        assert!(!vault.paused, EVaultPaused);
        
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidAmount);

        let depositor = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);

        // Update user balance
        if (table::contains(&vault.balances, depositor)) {
            let balance = table::borrow_mut(&mut vault.balances, depositor);
            *balance = *balance + amount;
        } else {
            table::add(&mut vault.balances, depositor, amount);
        };

        // Add to reserve
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut vault.reserve, coin_balance);
        vault.total_deposited = vault.total_deposited + amount;

        // Get new balance
        let new_balance = *table::borrow(&vault.balances, depositor);

        event::emit(DepositEvent {
            user: depositor,
            amount,
            new_balance,
            timestamp,
        });
    }

    /// Withdraw coins from vault
    public entry fun withdraw<T>(
        vault: &mut Vault<T>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(!vault.paused, EVaultPaused);
        assert!(amount > 0, EInvalidAmount);

        let withdrawer = tx_context::sender(ctx);
        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        
        assert!(table::contains(&vault.balances, withdrawer), EInsufficientBalance);
        let balance = table::borrow_mut(&mut vault.balances, withdrawer);
        assert!(*balance >= amount, EInsufficientBalance);

        // Update user balance
        *balance = *balance - amount;
        let new_balance = *balance;

        // Withdraw from reserve
        let withdrawn = balance::split(&mut vault.reserve, amount);
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

    /// Add yield from strategies (called by authorized contracts)
    public entry fun add_yield<T>(
        vault: &mut Vault<T>,
        yield_payment: Coin<T>,
        strategy_name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&yield_payment);
        let yield_balance = coin::into_balance(yield_payment);
        
        balance::join(&mut vault.reserve, yield_balance);
        vault.yield_balance = vault.yield_balance + amount;

        event::emit(YieldEarnedEvent {
            strategy: strategy_name,
            amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Pause/unpause vault (admin only)
    public entry fun set_paused<T>(
        _admin: &VaultAdminCap,
        vault: &mut Vault<T>,
        paused: bool,
        ctx: &mut TxContext
    ) {
        vault.paused = paused;
        
        event::emit(VaultPausedEvent {
            paused,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Emergency withdraw (admin only, when paused)
    public entry fun emergency_withdraw<T>(
        admin: &VaultAdminCap,
        vault: &mut Vault<T>,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(vault.paused, ENotAuthorized);
        
        let withdrawn = balance::split(&mut vault.reserve, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, recipient);
    }

    // ======== View Functions ========
    
    /// Get user balance
    public fun get_balance<T>(vault: &Vault<T>, user: address): u64 {
        if (table::contains(&vault.balances, user)) {
            *table::borrow(&vault.balances, user)
        } else {
            0
        }
    }

    /// Get total deposited
    public fun get_total_deposited<T>(vault: &Vault<T>): u64 {
        vault.total_deposited
    }

    /// Get total yield earned
    public fun get_yield_earned<T>(vault: &Vault<T>): u64 {
        vault.yield_balance
    }

    /// Get vault reserve balance
    public fun get_reserve_balance<T>(vault: &Vault<T>): u64 {
        balance::value(&vault.reserve)
    }

    /// Check if vault is paused
    public fun is_paused<T>(vault: &Vault<T>): bool {
        vault.paused
    }

    /// Get vault version
    public fun get_version<T>(vault: &Vault<T>): u64 {
        vault.version
    }

    // ======== Test Functions ========
    
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
}
