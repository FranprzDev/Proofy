use anchor_lang::prelude::*;

#[event]
pub struct AgreementCreated {
    pub agreement: Pubkey,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub agreement_id: u64,
    pub contract_hash: [u8; 32],
    pub total: u64,
    pub milestone_count: u8,
}

#[event]
pub struct AgreementAccepted {
    pub agreement: Pubkey,
    pub provider: Pubkey,
}

#[event]
pub struct AgreementFunded {
    pub agreement: Pubkey,
    pub client: Pubkey,
    pub total: u64,
}

#[event]
pub struct MilestoneReleased {
    pub agreement: Pubkey,
    pub index: u8,
    pub amount: u64,
    pub fee: u64,
    pub provider_amount: u64,
    pub evidence_hash: [u8; 32],
}

#[event]
pub struct DisputeOpened {
    pub agreement: Pubkey,
    pub index: u8,
    pub opened_by: Pubkey,
}

#[event]
pub struct DisputeResolved {
    pub agreement: Pubkey,
    pub index: u8,
    pub release_to_provider: bool,
    pub amount: u64,
    pub fee: u64,
}
