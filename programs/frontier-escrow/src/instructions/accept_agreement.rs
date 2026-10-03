use anchor_lang::prelude::*;

use crate::errors::EscrowError;
use crate::events::AgreementAccepted;
use crate::state::{Agreement, AGREEMENT_SEED};

#[derive(Accounts)]
pub struct AcceptAgreement<'info> {
    pub provider: Signer<'info>,
    #[account(
        mut,
        has_one = provider @ EscrowError::Unauthorized,
        seeds = [AGREEMENT_SEED, agreement.client.as_ref(), &agreement.agreement_id.to_le_bytes()],
        bump = agreement.bump
    )]
    pub agreement: Account<'info, Agreement>,
}

pub fn handler(ctx: Context<AcceptAgreement>, contract_hash: [u8; 32]) -> Result<()> {
    let agreement = &mut ctx.accounts.agreement;
    require!(
        agreement.contract_hash == contract_hash,
        EscrowError::HashMismatch
    );
    agreement.provider_accepted = true;
    emit!(AgreementAccepted {
        agreement: agreement.key(),
        provider: agreement.provider,
    });
    Ok(())
}
