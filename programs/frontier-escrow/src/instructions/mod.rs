pub mod accept_agreement;
pub mod create_agreement;
pub mod fund_agreement;
pub mod initialize_config;
pub mod open_dispute;
pub mod release_milestone;
pub mod resolve_dispute;

#[allow(ambiguous_glob_reexports)]
pub use accept_agreement::*;
pub use create_agreement::*;
pub use fund_agreement::*;
pub use initialize_config::*;
pub use open_dispute::*;
pub use release_milestone::*;
pub use resolve_dispute::*;

use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::EscrowError;
use crate::state::{BPS_DENOMINATOR, MAX_FEE_BPS, VAULT_SEED};

/// fee = amount * fee_bps / 10_000 using checked math (rounds down).
pub fn compute_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    let fee = (amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(EscrowError::MathOverflow)?
        / (BPS_DENOMINATOR as u128);
    u64::try_from(fee).map_err(|_| error!(EscrowError::MathOverflow))
}

/// Smallest milestone amount accepted at creation.
///
/// Payouts go to system accounts that may not exist yet, and the runtime rejects
/// a transfer that leaves a new account below the rent-exempt minimum for empty
/// data. The provider's net share (`amount - fee`, with fee at most
/// `MAX_FEE_BPS`) must therefore reach that minimum. The same bound keeps every
/// remaining vault balance rent-exempt (or zero) after each payout.
pub fn min_milestone_amount() -> Result<u64> {
    let rent_min = Rent::get()?.minimum_balance(0).max(1);
    let net_bps = BPS_DENOMINATOR - MAX_FEE_BPS as u64;
    let scaled = rent_min
        .checked_mul(BPS_DENOMINATOR)
        .ok_or(EscrowError::MathOverflow)?;
    Ok(scaled.div_ceil(net_bps))
}

/// Signer seeds of an agreement's vault PDA, built once per instruction.
pub struct VaultSeeds {
    agreement: Pubkey,
    bump: [u8; 1],
}

impl VaultSeeds {
    pub fn new(agreement: Pubkey, vault_bump: u8) -> Self {
        Self {
            agreement,
            bump: [vault_bump],
        }
    }

    fn seeds(&self) -> [&[u8]; 3] {
        [VAULT_SEED, self.agreement.as_ref(), &self.bump]
    }
}

/// Transfers lamports out of the system-owned vault PDA via a signed System CPI.
pub fn vault_transfer<'info>(
    system_program: &Program<'info, System>,
    vault: &SystemAccount<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
    seeds: &VaultSeeds,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let seeds = seeds.seeds();
    transfer(
        CpiContext::new_with_signer(
            system_program.key(),
            Transfer {
                from: vault.to_account_info(),
                to: to.clone(),
            },
            &[&seeds],
        ),
        amount,
    )
}

/// Pays `amount` out of the vault, splitting the platform fee to the treasury and
/// the remainder to the provider. Returns `(fee, provider_amount)`.
pub fn payout_to_provider<'info>(
    system_program: &Program<'info, System>,
    vault: &SystemAccount<'info>,
    treasury: &AccountInfo<'info>,
    provider: &AccountInfo<'info>,
    amount: u64,
    fee_bps: u16,
    seeds: &VaultSeeds,
) -> Result<(u64, u64)> {
    let fee = compute_fee(amount, fee_bps)?;
    let provider_amount = amount.checked_sub(fee).ok_or(EscrowError::MathOverflow)?;
    vault_transfer(system_program, vault, treasury, fee, seeds)?;
    vault_transfer(system_program, vault, provider, provider_amount, seeds)?;
    Ok((fee, provider_amount))
}
