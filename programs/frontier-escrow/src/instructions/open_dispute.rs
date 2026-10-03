use anchor_lang::prelude::*;

use crate::errors::EscrowError;
use crate::events::DisputeOpened;
use crate::state::{Agreement, MilestoneStatus, AGREEMENT_SEED};

#[derive(Accounts)]
pub struct OpenDispute<'info> {
    pub signer: Signer<'info>,
    #[account(
        mut,
        constraint = signer.key() == agreement.client || signer.key() == agreement.provider
            @ EscrowError::Unauthorized,
        seeds = [AGREEMENT_SEED, agreement.client.as_ref(), &agreement.agreement_id.to_le_bytes()],
        bump = agreement.bump
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handler(ctx: Context<OpenDispute>, index: u8) -> Result<()> {
    let agreement = &mut ctx.accounts.agreement;
    // Disputing before funding would freeze a milestone nobody can pay yet.
    require!(agreement.funded, EscrowError::NotFunded);
    require!(index < agreement.milestone_count, EscrowError::InvalidIndex);
    let milestone = &mut agreement.milestones[index as usize];
    require!(
        milestone.status == MilestoneStatus::Pending,
        EscrowError::InvalidStatus
    );
    milestone.status = MilestoneStatus::Disputed;
    emit!(DisputeOpened {
        agreement: agreement.key(),
        index,
        opened_by: ctx.accounts.signer.key(),
    });
    Ok(())
}
