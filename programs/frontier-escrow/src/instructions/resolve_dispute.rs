use anchor_lang::prelude::*;

use super::{payout_to_provider, vault_transfer, VaultSeeds};
use crate::errors::EscrowError;
use crate::events::DisputeResolved;
use crate::state::{Agreement, Config, MilestoneStatus, AGREEMENT_SEED, CONFIG_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub admin: Signer<'info>,
    #[account(
        has_one = admin @ EscrowError::Unauthorized,
        has_one = treasury @ EscrowError::Unauthorized,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        has_one = provider @ EscrowError::Unauthorized,
        has_one = client @ EscrowError::Unauthorized,
        seeds = [AGREEMENT_SEED, agreement.client.as_ref(), &agreement.agreement_id.to_le_bytes()],
        bump = agreement.bump
    )]
    pub agreement: Account<'info, Agreement>,
    #[account(
        mut,
        seeds = [VAULT_SEED, agreement.key().as_ref()],
        bump = agreement.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    /// CHECK: constrained to agreement.provider via has_one.
    #[account(mut)]
    pub provider: UncheckedAccount<'info>,
    /// CHECK: constrained to agreement.client via has_one.
    #[account(mut)]
    pub client: UncheckedAccount<'info>,
    /// CHECK: constrained to config.treasury via has_one.
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ResolveDispute>, index: u8, release_to_provider: bool) -> Result<()> {
    let agreement = &mut ctx.accounts.agreement;
    require!(agreement.funded, EscrowError::NotFunded);
    require!(index < agreement.milestone_count, EscrowError::InvalidIndex);
    let agreement_key = agreement.key();
    let seeds = VaultSeeds::new(agreement_key, agreement.vault_bump);
    let milestone = &mut agreement.milestones[index as usize];
    require!(
        milestone.status == MilestoneStatus::Disputed,
        EscrowError::InvalidStatus
    );

    let amount = milestone.amount;
    let fee = if release_to_provider {
        milestone.status = MilestoneStatus::Released;
        let (fee, _) = payout_to_provider(
            &ctx.accounts.system_program,
            &ctx.accounts.vault,
            &ctx.accounts.treasury.to_account_info(),
            &ctx.accounts.provider.to_account_info(),
            amount,
            ctx.accounts.config.fee_bps,
            &seeds,
        )?;
        fee
    } else {
        milestone.status = MilestoneStatus::Refunded;
        vault_transfer(
            &ctx.accounts.system_program,
            &ctx.accounts.vault,
            &ctx.accounts.client.to_account_info(),
            amount,
            &seeds,
        )?;
        0
    };

    emit!(DisputeResolved {
        agreement: agreement_key,
        index,
        release_to_provider,
        amount,
        fee,
    });
    Ok(())
}
