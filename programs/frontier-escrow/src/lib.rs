use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("95W1tXhcMnCPXqUqrxpBp1P6aBwhoXjvzr6nnK62JzMN");

#[program]
pub mod frontier_escrow {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        attestor: Pubkey,
        treasury: Pubkey,
        fee_bps: u16,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, attestor, treasury, fee_bps)
    }

    pub fn create_agreement(
        ctx: Context<CreateAgreement>,
        agreement_id: u64,
        contract_hash: [u8; 32],
        amounts: Vec<u64>,
    ) -> Result<()> {
        instructions::create_agreement::handler(ctx, agreement_id, contract_hash, amounts)
    }

    pub fn accept_agreement(ctx: Context<AcceptAgreement>, contract_hash: [u8; 32]) -> Result<()> {
        instructions::accept_agreement::handler(ctx, contract_hash)
    }

    pub fn fund_agreement(ctx: Context<FundAgreement>) -> Result<()> {
        instructions::fund_agreement::handler(ctx)
    }

    pub fn release_milestone(
        ctx: Context<ReleaseMilestone>,
        index: u8,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        instructions::release_milestone::handler(ctx, index, evidence_hash)
    }

    pub fn open_dispute(ctx: Context<OpenDispute>, index: u8) -> Result<()> {
        instructions::open_dispute::handler(ctx, index)
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        index: u8,
        release_to_provider: bool,
    ) -> Result<()> {
        instructions::resolve_dispute::handler(ctx, index, release_to_provider)
    }
}
