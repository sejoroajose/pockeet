module pockeet::yield_strategy {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;

    // ======== Errors ========
    const EInsufficientBalance: u64 = 0;
    const EStrategyPaused: u64 = 1;
    const EInvalidAmount: u64 = 2;
    const ENotAuthorized: u64 = 3;

    // ======== Constants ========
    const STRATEGY_CONSERVATIVE: u8 = 0;
    const STRATEGY_MODERATE: u8 = 1;
    const STRATEGY_AGGRESSIVE: u8 = 2;

    // ======== Structs ========
    
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

    // ======== Events ========
    
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

    // ======== Functions ========
    
    /// Module initializer
    fun init(ctx: &mut TxContext) {
        let admin_cap = StrategyAdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Create new yield strategy
    public entry fun create_strategy<T>(
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

    /// Stake coins in strategy
    public entry fun stake<T>(
        strategy: &mut YieldStrategy<T>,
        payment: Coin<T>,
        ctx: &mut TxContext
    ) {
        assert!(!strategy.paused, EStrategyPaused);
        
        let amount = coin::value(&payment);
        assert!(amount > 0, EInvalidAmount);

        let staker = tx_context::sender(ctx);

        // Update user stake
        if (table::contains(&strategy.stakes, staker)) {
            let stake = table::borrow_mut(&mut strategy.stakes, staker);
            *stake = *stake + amount;
        } else {
            table::add(&mut strategy.stakes, staker, amount);
        };

        // Add to reserve
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut strategy.reserve, coin_balance);
        strategy.tvl = strategy.tvl + amount;

        event::emit(StakeEvent {
            user: staker,
            amount,
            strategy_type: strategy.strategy_type,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Unstake coins from strategy
    public entry fun unstake<T>(
        strategy: &mut YieldStrategy<T>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, EInvalidAmount);

        let unstaker = tx_context::sender(ctx);
        
        assert!(table::contains(&strategy.stakes, unstaker), EInsufficientBalance);
        let stake = table::borrow_mut(&mut strategy.stakes, unstaker);
        assert!(*stake >= amount, EInsufficientBalance);

        // Update user stake
        *stake = *stake - amount;

        // Withdraw from reserve
        let withdrawn = balance::split(&mut strategy.reserve, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, unstaker);

        strategy.tvl = strategy.tvl - amount;

        event::emit(UnstakeEvent {
            user: unstaker,
            amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Distribute yield to strategy (called by admin or automated bot)
    public entry fun distribute_yield<T>(
        _admin: &StrategyAdminCap,
        strategy: &mut YieldStrategy<T>,
        yield_payment: Coin<T>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&yield_payment);
        let yield_balance = coin::into_balance(yield_payment);
        
        balance::join(&mut strategy.reserve, yield_balance);

        event::emit(YieldDistributedEvent {
            total_yield: amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Pause/unpause strategy
    public entry fun set_paused<T>(
        _admin: &StrategyAdminCap,
        strategy: &mut YieldStrategy<T>,
        paused: bool,
        _ctx: &mut TxContext
    ) {
        strategy.paused = paused;
    }

    // ======== View Functions ========
    
    /// Get user stake
    public fun get_stake<T>(strategy: &YieldStrategy<T>, user: address): u64 {
        if (table::contains(&strategy.stakes, user)) {
            *table::borrow(&strategy.stakes, user)
        } else {
            0
        }
    }

    /// Get TVL
    public fun get_tvl<T>(strategy: &YieldStrategy<T>): u64 {
        strategy.tvl
    }

    /// Get target APY
    public fun get_target_apy<T>(strategy: &YieldStrategy<T>): u64 {
        strategy.target_apy
    }

    /// Get strategy type
    public fun get_strategy_type<T>(strategy: &YieldStrategy<T>): u8 {
        strategy.strategy_type
    }

    /// Check if paused
    public fun is_paused<T>(strategy: &YieldStrategy<T>): bool {
        strategy.paused
    }

    // ======== Test Functions ========
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun get_strategy_type_conservative(): u8 {
        STRATEGY_CONSERVATIVE
    }

    #[test_only]
    public fun get_strategy_type_moderate(): u8 {
        STRATEGY_MODERATE
    }

    #[test_only]
    public fun get_strategy_type_aggressive(): u8 {
        STRATEGY_AGGRESSIVE
    }
}
