use anchor_lang::prelude::*;

use crate::errors::EscrowError;
use crate::events::DisputeOpened;
use crate::state::{Agreement, AGREEMENT_SEED, STATUS_DISPUTED, STATUS_PENDING};

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
    require!(index < agreement.milestone_count, EscrowError::InvalidIndex);
    let milestone = &mut agreement.milestones[index as usize];
    require!(
        milestone.status == STATUS_PENDING,
        EscrowError::InvalidStatus
    );
    milestone.status = STATUS_DISPUTED;
    emit!(DisputeOpened {
        agreement: agreement.key(),
        index,
        opened_by: ctx.accounts.signer.key(),
    });
    Ok(())
}
