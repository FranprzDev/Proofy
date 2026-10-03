use anchor_lang::prelude::*;

pub const MAX_MILESTONES: usize = 8;
pub const MAX_FEE_BPS: u16 = 1000;
pub const BPS_DENOMINATOR: u64 = 10_000;

pub const CONFIG_SEED: &[u8] = b"config";
pub const AGREEMENT_SEED: &[u8] = b"agreement";
pub const VAULT_SEED: &[u8] = b"vault";

/// Lifecycle of a single milestone. Borsh encodes it as a one-byte tag, so the
/// on-chain layout is identical to the former `u8` status
/// (Pending = 0, Released = 1, Disputed = 2, Refunded = 3).
///
/// Transitions: `Pending -> Released` (attestor), `Pending -> Disputed`
/// (client or provider), `Disputed -> Released | Refunded` (admin). `Released`
/// and `Refunded` are terminal.
#[derive(
    AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Default, PartialEq, Eq, InitSpace,
)]
#[repr(u8)]
pub enum MilestoneStatus {
    /// Funds are locked in the vault awaiting release or dispute.
    #[default]
    Pending,
    /// Paid out to the provider (minus platform fee).
    Released,
    /// Frozen until the admin resolves it.
    Disputed,
    /// Returned in full to the client.
    Refunded,
}

/// Program-wide settings. Singleton PDA at `[CONFIG_SEED]`.
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub attestor: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub bump: u8,
}

/// One payment tranche of an agreement.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default, InitSpace)]
pub struct Milestone {
    pub amount: u64,
    pub status: MilestoneStatus,
    pub evidence_hash: [u8; 32],
}

/// Escrow between a client and a provider. PDA at
/// `[AGREEMENT_SEED, client, agreement_id_le]`; funds live in the system-owned
/// vault PDA at `[VAULT_SEED, agreement]`.
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
    /// Sum of all milestone amounts (checked).
    pub fn total(&self) -> Result<u64> {
        self.milestones[..self.milestone_count as usize]
            .iter()
            .try_fold(0u64, |acc, m| acc.checked_add(m.amount))
            .ok_or_else(|| error!(crate::errors::EscrowError::MathOverflow))
    }
}
