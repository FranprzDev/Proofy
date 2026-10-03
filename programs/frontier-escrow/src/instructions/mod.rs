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
use crate::state::BPS_DENOMINATOR;

/// fee = amount * fee_bps / 10_000 using checked math.
pub fn compute_fee(amount: u64, fee_bps: u16) -> Result<u64> {
    let fee = (amount as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(EscrowError::MathOverflow)?
        / (BPS_DENOMINATOR as u128);
    u64::try_from(fee).map_err(|_| error!(EscrowError::MathOverflow))
}

/// Transfers lamports out of the system-owned vault PDA via a signed System CPI.
pub fn vault_transfer<'info>(
    system_program: &Program<'info, System>,
    vault: &SystemAccount<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    transfer(
        CpiContext::new_with_signer(
            system_program.key(),
            Transfer {
                from: vault.to_account_info(),
                to: to.clone(),
            },
            signer_seeds,
        ),
        amount,
    )
}
