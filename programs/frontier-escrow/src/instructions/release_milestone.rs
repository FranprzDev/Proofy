use anchor_lang::prelude::*;

use super::{compute_fee, vault_transfer};
use crate::errors::EscrowError;
use crate::events::MilestoneReleased;
use crate::state::{
    Agreement, Config, AGREEMENT_SEED, CONFIG_SEED, STATUS_PENDING, STATUS_RELEASED, VAULT_SEED,
};

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
    let milestone = &mut agreement.milestones[index as usize];
    require!(
        milestone.status == STATUS_PENDING,
        EscrowError::InvalidStatus
    );

    let amount = milestone.amount;
    let fee = compute_fee(amount, ctx.accounts.config.fee_bps)?;
    let provider_amount = amount.checked_sub(fee).ok_or(EscrowError::MathOverflow)?;

    // Effects before interactions.
    milestone.status = STATUS_RELEASED;
    milestone.evidence_hash = evidence_hash;

    let agreement_key = agreement.key();
    let vault_bump = [agreement.vault_bump];
    let seeds: &[&[u8]] = &[VAULT_SEED, agreement_key.as_ref(), &vault_bump];
    let signer_seeds = &[seeds];
    vault_transfer(
        &ctx.accounts.system_program,
        &ctx.accounts.vault,
        &ctx.accounts.treasury.to_account_info(),
        fee,
        signer_seeds,
    )?;
    vault_transfer(
        &ctx.accounts.system_program,
        &ctx.accounts.vault,
        &ctx.accounts.provider.to_account_info(),
        provider_amount,
        signer_seeds,
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
