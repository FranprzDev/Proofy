use anchor_lang::prelude::*;

use crate::errors::EscrowError;
use crate::events::AgreementCreated;
use crate::state::{
    Agreement, Milestone, AGREEMENT_SEED, MAX_MILESTONES, STATUS_PENDING, VAULT_SEED,
};

#[derive(Accounts)]
#[instruction(agreement_id: u64)]
pub struct CreateAgreement<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    /// CHECK: any account; only stored and compared against later.
    pub provider: UncheckedAccount<'info>,
    #[account(
        init,
        payer = client,
        space = 8 + Agreement::INIT_SPACE,
        seeds = [AGREEMENT_SEED, client.key().as_ref(), &agreement_id.to_le_bytes()],
        bump
    )]
    pub agreement: Account<'info, Agreement>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateAgreement>,
    agreement_id: u64,
    contract_hash: [u8; 32],
    amounts: Vec<u64>,
) -> Result<()> {
    require!(
        !amounts.is_empty() && amounts.len() <= MAX_MILESTONES,
        EscrowError::InvalidMilestones
    );
    // Each remaining vault balance must stay rent-exempt (or reach zero), so every
    // milestone must be at least the minimum balance of a zero-data account.
    let min_amount = Rent::get()?.minimum_balance(0);
    require!(
        amounts.iter().all(|a| *a >= min_amount.max(1)),
        EscrowError::InvalidMilestones
    );
    require_keys_neq!(
        ctx.accounts.client.key(),
        ctx.accounts.provider.key(),
        EscrowError::SameParty
    );

    let agreement_key = ctx.accounts.agreement.key();
    let agreement = &mut ctx.accounts.agreement;
    agreement.client = ctx.accounts.client.key();
    agreement.provider = ctx.accounts.provider.key();
    agreement.agreement_id = agreement_id;
    agreement.contract_hash = contract_hash;
    agreement.provider_accepted = false;
    agreement.funded = false;
    agreement.milestone_count = amounts.len() as u8;
    agreement.milestones = [Milestone::default(); MAX_MILESTONES];
    for (slot, amount) in agreement.milestones.iter_mut().zip(amounts.iter()) {
        slot.amount = *amount;
        slot.status = STATUS_PENDING;
    }
    agreement.bump = ctx.bumps.agreement;
    agreement.vault_bump =
        Pubkey::find_program_address(&[VAULT_SEED, agreement_key.as_ref()], &crate::ID).1;

    let total = agreement.total()?;
    emit!(AgreementCreated {
        agreement: agreement_key,
        client: agreement.client,
        provider: agreement.provider,
        agreement_id,
        contract_hash,
        total,
        milestone_count: agreement.milestone_count,
    });
    Ok(())
}
