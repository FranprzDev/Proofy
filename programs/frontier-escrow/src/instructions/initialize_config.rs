use anchor_lang::prelude::*;

use crate::errors::EscrowError;
use crate::state::{Config, CONFIG_SEED, MAX_FEE_BPS};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeConfig>,
    attestor: Pubkey,
    treasury: Pubkey,
    fee_bps: u16,
) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, EscrowError::FeeTooHigh);
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.attestor = attestor;
    config.treasury = treasury;
    config.fee_bps = fee_bps;
    config.bump = ctx.bumps.config;
    Ok(())
}
