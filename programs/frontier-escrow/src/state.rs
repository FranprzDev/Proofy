use anchor_lang::prelude::*;

pub const MAX_MILESTONES: usize = 8;
pub const MAX_FEE_BPS: u16 = 1000;
pub const BPS_DENOMINATOR: u64 = 10_000;

pub const STATUS_PENDING: u8 = 0;
pub const STATUS_RELEASED: u8 = 1;
pub const STATUS_DISPUTED: u8 = 2;
pub const STATUS_REFUNDED: u8 = 3;

pub const CONFIG_SEED: &[u8] = b"config";
pub const AGREEMENT_SEED: &[u8] = b"agreement";
pub const VAULT_SEED: &[u8] = b"vault";

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub attestor: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct Milestone {
    pub amount: u64,
    pub status: u8,
    pub evidence_hash: [u8; 32],
}

#[account]
#[derive(InitSpace)]
pub struct Agreement {
    pub client: Pubkey,
    pub provider: Pubkey,
    pub agreement_id: u64,
    pub contract_hash: [u8; 32],
    pub provider_accepted: bool,
    pub funded: bool,
    pub milestone_count: u8,
    pub milestones: [Milestone; MAX_MILESTONES],
    pub bump: u8,
    pub vault_bump: u8,
}

impl Agreement {
    pub fn total(&self) -> Result<u64> {
        self.milestones[..self.milestone_count as usize]
            .iter()
            .try_fold(0u64, |acc, m| acc.checked_add(m.amount))
            .ok_or_else(|| error!(crate::errors::EscrowError::MathOverflow))
    }
}
