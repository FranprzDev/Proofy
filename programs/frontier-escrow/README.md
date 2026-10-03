# frontier-escrow

Anchor 1.1.2 program: milestone-based native SOL escrow. An authorized attestor releases milestones (fee split to treasury), a platform admin resolves disputes. Max 8 milestones per agreement.

## Accounts and PDA seeds
| Account | Seeds | Notes |
|---|---|---|
| Config | `["config"]` | admin, attestor, treasury, fee_bps (<= 1000), bump |
| Agreement | `["agreement", client, agreement_id u64 LE]` | parties, contract_hash, flags, up to 8 milestones |
| Vault | `["vault", agreement]` | system-owned PDA holding escrowed lamports |

Milestone status: 0 Pending, 1 Released, 2 Disputed, 3 Refunded.

## Instructions
`initialize_config`, `create_agreement`, `accept_agreement`, `fund_agreement`, `release_milestone` (attestor), `open_dispute` (client or provider), `resolve_dispute` (admin). Events and errors are in the IDL (`idl/frontier_escrow.json`).

Note: each milestone amount must be at least the rent-exempt minimum of a 0-byte account (890,880 lamports) so the vault never ends in a non-exempt state. Recipients (provider, treasury) must be able to hold the received lamports (existing account or amount >= rent minimum).

## Build / test
```
anchor build            # produces target/deploy/frontier_escrow.so and target/idl/
cargo test -p frontier-escrow   # LiteSVM tests; needs the built .so
cp target/idl/frontier_escrow.json programs/frontier-escrow/idl/
```

## Deploy to devnet
```
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```
The program keypair is `target/deploy/frontier_escrow-keypair.json` (gitignored); the program ID is in `Anchor.toml` and `declare_id!`. Call `initialize_config` once after deploying.
