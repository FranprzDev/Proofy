use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("Invalid milestones: need 1..=8 amounts, each above the minimum")]
    InvalidMilestones,
    #[msg("Milestone index out of range")]
    InvalidIndex,
    #[msg("Milestone status does not allow this action")]
    InvalidStatus,
    #[msg("Provider has not accepted the agreement")]
    NotAccepted,
    #[msg("Agreement is already funded")]
    AlreadyFunded,
    #[msg("Agreement is not funded")]
    NotFunded,
    #[msg("Contract hash does not match")]
    HashMismatch,
    #[msg("Fee exceeds the 1000 bps maximum")]
    FeeTooHigh,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Client and provider must be different")]
    SameParty,
}
