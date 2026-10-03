use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::errors::EscrowError;
use crate::events::AgreementFunded;
use crate::state::{Agreement, AGREEMENT_SEED, VAULT_SEED};

#[derive(Accounts)]
pub struct FundAgreement<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    #[account(
        mut,
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
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<FundAgreement>) -> Result<()> {
    let agreement = &mut ctx.accounts.agreement;
    require!(agreement.provider_accepted, EscrowError::NotAccepted);
    require!(!agreement.funded, EscrowError::AlreadyFunded);
    let total = agreement.total()?;
    agreement.funded = true;

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.key(),
            Transfer {
                from: ctx.accounts.client.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        total,
    )?;

    emit!(AgreementFunded {
        agreement: agreement.key(),
        client: agreement.client,
        total,
    });
    Ok(())
}
