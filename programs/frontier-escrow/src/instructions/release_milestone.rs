use anchor_lang::prelude::*;

use super::{payout_to_provider, VaultSeeds};
use crate::errors::EscrowError;
use crate::events::MilestoneReleased;
use crate::state::{Agreement, Config, MilestoneStatus, AGREEMENT_SEED, CONFIG_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct ReleaseMilestone<'info> {
    pub attestor: Signer<'info>,
    #[account(
        has_one = attestor @ EscrowError::Unauthorized,
        has_one = treasury @ EscrowError::Unauthorized,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,
    #[account(
        mut,
        has_one = provider @ EscrowError::Unauthorized,
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
    /// CHECK: constrained to config.treasury via has_one.
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ReleaseMilestone>, index: u8, evidence_hash: [u8; 32]) -> Result<()> {
    let agreement = &mut ctx.accounts.agreement;
    require!(agreement.funded, EscrowError::NotFunded);
    require!(index < agreement.milestone_count, EscrowError::InvalidIndex);
    let agreement_key = agreement.key();
    let seeds = VaultSeeds::new(agreement_key, agreement.vault_bump);
    let milestone = &mut agreement.milestones[index as usize];
    require!(
        milestone.status == MilestoneStatus::Pending,
        EscrowError::InvalidStatus
    );

    // Effects before interactions.
    let amount = milestone.amount;
    milestone.status = MilestoneStatus::Released;
    milestone.evidence_hash = evidence_hash;

    let (fee, provider_amount) = payout_to_provider(
        &ctx.accounts.system_program,
        &ctx.accounts.vault,
        &ctx.accounts.treasury.to_account_info(),
        &ctx.accounts.provider.to_account_info(),
        amount,
        ctx.accounts.config.fee_bps,
        &seeds,
    )?;

    emit!(MilestoneReleased {
        agreement: agreement_key,
        index,
        amount,
        fee,
        provider_amount,
        evidence_hash,
    });
    Ok(())
}
