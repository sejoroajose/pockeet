#[test_only]
module pockeet::vault_tests {
    use sui::test_scenario::{Self as test, Scenario, next_tx, ctx};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use pockeet::vault::{Self, Vault, VaultAdminCap};

    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;

    #[test]
    fun test_create_vault() {
        let mut scenario = test::begin(ADMIN);
        
        // Initialize module
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        // Create vault
        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // Verify vault exists
        next_tx(&mut scenario, USER1);
        {
            let vault = test::take_shared<Vault<SUI>>(&scenario);
            assert!(vault::get_total_deposited(&vault) == 0, 0);
            assert!(vault::get_yield_earned(&vault) == 0, 1);
            test::return_shared(vault);
        };

        test::end(scenario);
    }

    #[test]
    fun test_deposit() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // User deposits
        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, ctx(&mut scenario));
            
            vault::deposit(&mut vault, payment, ctx(&mut scenario));
            
            assert!(vault::get_balance(&vault, USER1) == 1000, 0);
            assert!(vault::get_total_deposited(&vault) == 1000, 1);
            
            test::return_shared(vault);
        };

        test::end(scenario);
    }

    #[test]
    fun test_withdraw() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup and deposit
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, ctx(&mut scenario));
            vault::deposit(&mut vault, payment, ctx(&mut scenario));
            test::return_shared(vault);
        };

        // Withdraw
        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            
            vault::withdraw<SUI>(&mut vault, 300, ctx(&mut scenario));
            
            assert!(vault::get_balance(&vault, USER1) == 700, 0);
            assert!(vault::get_total_deposited(&vault) == 700, 1);
            
            test::return_shared(vault);
        };

        test::end(scenario);
    }

    #[test]
    fun test_multiple_users() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // User 1 deposits
        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, ctx(&mut scenario));
            vault::deposit(&mut vault, payment, ctx(&mut scenario));
            test::return_shared(vault);
        };

        // User 2 deposits
        next_tx(&mut scenario, USER2);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(2000, ctx(&mut scenario));
            vault::deposit(&mut vault, payment, ctx(&mut scenario));
            test::return_shared(vault);
        };

        // Verify balances
        next_tx(&mut scenario, USER1);
        {
            let vault = test::take_shared<Vault<SUI>>(&scenario);
            
            assert!(vault::get_balance(&vault, USER1) == 1000, 0);
            assert!(vault::get_balance(&vault, USER2) == 2000, 1);
            assert!(vault::get_total_deposited(&vault) == 3000, 2);
            
            test::return_shared(vault);
        };

        test::end(scenario);
    }

    #[test]
    fun test_pause_unpause() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // Pause vault
        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            
            vault::set_paused(&admin_cap, &mut vault, true, ctx(&mut scenario));
            
            assert!(vault::is_paused(&vault), 0);
            
            test::return_shared(vault);
            test::return_to_sender(&scenario, admin_cap);
        };

        // Unpause vault
        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            
            vault::set_paused(&admin_cap, &mut vault, false, ctx(&mut scenario));
            
            assert!(!vault::is_paused(&vault), 0);
            
            test::return_shared(vault);
            test::return_to_sender(&scenario, admin_cap);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = pockeet::vault::EInsufficientBalance)]
    fun test_withdraw_insufficient_balance() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // Try to withdraw without deposit
        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            vault::withdraw<SUI>(&mut vault, 100, ctx(&mut scenario));
            test::return_shared(vault);
        };

        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = pockeet::vault::EVaultPaused)]
    fun test_deposit_when_paused() {
        let mut scenario = test::begin(ADMIN);
        
        // Setup
        {
            vault::init_for_testing(ctx(&mut scenario));
        };

        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            vault::create_vault<SUI>(&admin_cap, ctx(&mut scenario));
            test::return_to_sender(&scenario, admin_cap);
        };

        // Pause vault
        next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = test::take_from_sender<VaultAdminCap>(&scenario);
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            vault::set_paused(&admin_cap, &mut vault, true, ctx(&mut scenario));
            test::return_shared(vault);
            test::return_to_sender(&scenario, admin_cap);
        };

        // Try to deposit
        next_tx(&mut scenario, USER1);
        {
            let mut vault = test::take_shared<Vault<SUI>>(&scenario);
            let payment = coin::mint_for_testing<SUI>(1000, ctx(&mut scenario));
            vault::deposit(&mut vault, payment, ctx(&mut scenario));
            test::return_shared(vault);
        };

        test::end(scenario);
    }
}
