use anchor_lang::{AccountDeserialize, InstructionData, ToAccountMetas};
use frontier_escrow::state::{Agreement, Config, MilestoneStatus};
use litesvm::LiteSVM;
use solana_instruction::Instruction;
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_transaction::Transaction;

const SOL: u64 = 1_000_000_000;
const PROGRAM_SO: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../target/deploy/frontier_escrow.so"
);
const HASH: [u8; 32] = [7u8; 32];
const SYSTEM: Pubkey = solana_system_interface::program::ID;

struct Env {
    svm: LiteSVM,
    admin: Keypair,
    attestor: Keypair,
    treasury: Pubkey,
    client: Keypair,
    provider: Keypair,
    config: Pubkey,
    agreement: Pubkey,
    vault: Pubkey,
}

fn pda(seeds: &[&[u8]]) -> Pubkey {
    Pubkey::find_program_address(seeds, &frontier_escrow::ID).0
}

fn send(
    svm: &mut LiteSVM,
    ix: Instruction,
    payer: &Keypair,
    extra: &[&Keypair],
) -> Result<(), String> {
    let mut signers: Vec<&Keypair> = vec![payer];
    signers.extend_from_slice(extra);
    svm.expire_blockhash();
    let tx = Transaction::new(
        &signers,
        Message::new(&[ix], Some(&payer.pubkey())),
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx)
        .map(|_| ())
        .map_err(|e| format!("{:?}", e.err))
}

/// Anchor custom errors surface as `Custom(6000 + variant index)`; match the code.
fn code(e: frontier_escrow::errors::EscrowError) -> String {
    let n: u32 = anchor_lang::error::ERROR_CODE_OFFSET + e as u32;
    format!("Custom({n})")
}

fn assert_err(res: Result<(), String>, e: frontier_escrow::errors::EscrowError) {
    let err = res.expect_err("expected failure");
    assert!(err.contains(&code(e)), "unexpected error: {err}");
}

fn ix_init(env: &Env, fee_bps: u16) -> Instruction {
    Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::InitializeConfig {
            admin: env.admin.pubkey(),
            config: env.config,
            system_program: SYSTEM,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::InitializeConfig {
            attestor: env.attestor.pubkey(),
            treasury: env.treasury,
            fee_bps,
        }
        .data(),
    }
}

fn setup() -> Env {
    let mut svm = LiteSVM::new();
    svm.add_program_from_file(frontier_escrow::ID, PROGRAM_SO)
        .expect("run `anchor build` first");
    let admin = Keypair::new();
    let attestor = Keypair::new();
    let client = Keypair::new();
    let provider = Keypair::new();
    let treasury = Keypair::new().pubkey();
    for k in [&admin, &attestor, &client, &provider] {
        svm.airdrop(&k.pubkey(), 100 * SOL).unwrap();
    }
    svm.airdrop(&treasury, SOL).unwrap();
    let config = pda(&[b"config"]);
    let agreement = pda(&[b"agreement", client.pubkey().as_ref(), &1u64.to_le_bytes()]);
    let vault = pda(&[b"vault", agreement.as_ref()]);
    Env {
        svm,
        admin,
        attestor,
        treasury,
        client,
        provider,
        config,
        agreement,
        vault,
    }
}

fn init_config(env: &mut Env, fee_bps: u16) -> Result<(), String> {
    let ix = ix_init(env, fee_bps);
    let admin = env.admin.insecure_clone();
    send(&mut env.svm, ix, &admin, &[])
}

fn create(env: &mut Env, amounts: Vec<u64>) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::CreateAgreement {
            client: env.client.pubkey(),
            provider: env.provider.pubkey(),
            agreement: env.agreement,
            system_program: SYSTEM,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::CreateAgreement {
            agreement_id: 1,
            contract_hash: HASH,
            amounts,
        }
        .data(),
    };
    let c = env.client.insecure_clone();
    send(&mut env.svm, ix, &c, &[])
}

fn accept(env: &mut Env, hash: [u8; 32]) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::AcceptAgreement {
            provider: env.provider.pubkey(),
            agreement: env.agreement,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::AcceptAgreement {
            contract_hash: hash,
        }
        .data(),
    };
    let p = env.provider.insecure_clone();
    send(&mut env.svm, ix, &p, &[])
}

fn fund(env: &mut Env) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::FundAgreement {
            client: env.client.pubkey(),
            agreement: env.agreement,
            vault: env.vault,
            system_program: SYSTEM,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::FundAgreement {}.data(),
    };
    let c = env.client.insecure_clone();
    send(&mut env.svm, ix, &c, &[])
}

fn release(env: &mut Env, index: u8, signer: &Keypair) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::ReleaseMilestone {
            attestor: signer.pubkey(),
            config: env.config,
            agreement: env.agreement,
            vault: env.vault,
            provider: env.provider.pubkey(),
            treasury: env.treasury,
            system_program: SYSTEM,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::ReleaseMilestone {
            index,
            evidence_hash: [9u8; 32],
        }
        .data(),
    };
    send(&mut env.svm, ix, signer, &[])
}

fn dispute(env: &mut Env, index: u8, signer: &Keypair) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::OpenDispute {
            signer: signer.pubkey(),
            agreement: env.agreement,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::OpenDispute { index }.data(),
    };
    send(&mut env.svm, ix, signer, &[])
}

fn resolve(env: &mut Env, index: u8, to_provider: bool, signer: &Keypair) -> Result<(), String> {
    let ix = Instruction {
        program_id: frontier_escrow::ID,
        accounts: frontier_escrow::accounts::ResolveDispute {
            admin: signer.pubkey(),
            config: env.config,
            agreement: env.agreement,
            vault: env.vault,
            provider: env.provider.pubkey(),
            client: env.client.pubkey(),
            treasury: env.treasury,
            system_program: SYSTEM,
        }
        .to_account_metas(None),
        data: frontier_escrow::instruction::ResolveDispute {
            index,
            release_to_provider: to_provider,
        }
        .data(),
    };
    send(&mut env.svm, ix, signer, &[])
}

fn bal(env: &Env, k: &Pubkey) -> u64 {
    env.svm.get_balance(k).unwrap_or(0)
}

/// config + agreement (2 milestones) accepted and funded at 250 bps.
fn funded_env() -> Env {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    create(&mut env, vec![2 * SOL, 3 * SOL]).unwrap();
    accept(&mut env, HASH).unwrap();
    fund(&mut env).unwrap();
    env
}

fn read_agreement(env: &Env) -> Agreement {
    let acc = env.svm.get_account(&env.agreement).unwrap();
    Agreement::try_deserialize(&mut acc.data.as_slice()).unwrap()
}

use frontier_escrow::errors::EscrowError as E;

#[test]
fn happy_path_fee_split() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    let cfg =
        Config::try_deserialize(&mut env.svm.get_account(&env.config).unwrap().data.as_slice())
            .unwrap();
    assert_eq!(cfg.fee_bps, 250);
    create(&mut env, vec![2 * SOL, 3 * SOL]).unwrap();
    accept(&mut env, HASH).unwrap();

    let client_before = bal(&env, &env.client.pubkey());
    fund(&mut env).unwrap();
    assert_eq!(bal(&env, &env.vault), 5 * SOL);
    assert_eq!(
        client_before - bal(&env, &env.client.pubkey()),
        5 * SOL + 5_000
    ); // + 1 signature fee

    let (p0, t0) = (bal(&env, &env.provider.pubkey()), bal(&env, &env.treasury));
    let attestor = env.attestor.insecure_clone();
    release(&mut env, 0, &attestor).unwrap();
    let fee = 2 * SOL * 250 / 10_000; // 50_000_000
    assert_eq!(bal(&env, &env.treasury) - t0, fee);
    assert_eq!(bal(&env, &env.provider.pubkey()) - p0, 2 * SOL - fee);
    assert_eq!(bal(&env, &env.vault), 3 * SOL);
    let a = read_agreement(&env);
    assert_eq!(a.milestones[0].status, MilestoneStatus::Released);
    assert_eq!(a.milestones[0].evidence_hash, [9u8; 32]);

    release(&mut env, 1, &attestor).unwrap();
    assert_eq!(bal(&env, &env.vault), 0);
    assert_eq!(bal(&env, &env.treasury) - t0, fee + 3 * SOL * 250 / 10_000);
}

#[test]
fn wrong_attestor_rejected() {
    let mut env = funded_env();
    let rogue = env.provider.insecure_clone();
    assert_err(release(&mut env, 0, &rogue), E::Unauthorized);
}

#[test]
fn release_before_fund_rejected() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    create(&mut env, vec![SOL]).unwrap();
    accept(&mut env, HASH).unwrap();
    let attestor = env.attestor.insecure_clone();
    assert_err(release(&mut env, 0, &attestor), E::NotFunded);
}

#[test]
fn fund_before_accept_rejected() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    create(&mut env, vec![SOL]).unwrap();
    assert_err(fund(&mut env), E::NotAccepted);
}

#[test]
fn double_fund_rejected() {
    let mut env = funded_env();
    assert_err(fund(&mut env), E::AlreadyFunded);
}

#[test]
fn double_release_rejected() {
    let mut env = funded_env();
    let attestor = env.attestor.insecure_clone();
    release(&mut env, 0, &attestor).unwrap();
    assert_err(release(&mut env, 0, &attestor), E::InvalidStatus);
    assert_err(release(&mut env, 5, &attestor), E::InvalidIndex);
}

#[test]
fn hash_mismatch_on_accept() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    create(&mut env, vec![SOL]).unwrap();
    assert_err(accept(&mut env, [1u8; 32]), E::HashMismatch);
}

#[test]
fn dispute_blocks_release() {
    let mut env = funded_env();
    let client = env.client.insecure_clone();
    dispute(&mut env, 0, &client).unwrap();
    let attestor = env.attestor.insecure_clone();
    assert_err(release(&mut env, 0, &attestor), E::InvalidStatus);
    // unrelated party cannot open a dispute
    let stranger = Keypair::new();
    env.svm.airdrop(&stranger.pubkey(), SOL).unwrap();
    assert_err(dispute(&mut env, 1, &stranger), E::Unauthorized);
}

#[test]
fn resolve_refund_to_client() {
    let mut env = funded_env();
    let provider = env.provider.insecure_clone();
    dispute(&mut env, 0, &provider).unwrap();
    let c0 = bal(&env, &env.client.pubkey());
    let (p0, t0) = (bal(&env, &env.provider.pubkey()), bal(&env, &env.treasury));
    let admin = env.admin.insecure_clone();
    resolve(&mut env, 0, false, &admin).unwrap();
    assert_eq!(bal(&env, &env.client.pubkey()) - c0, 2 * SOL);
    assert_eq!(bal(&env, &env.provider.pubkey()), p0);
    assert_eq!(bal(&env, &env.treasury), t0);
    assert_eq!(
        read_agreement(&env).milestones[0].status,
        MilestoneStatus::Refunded
    );
    assert_eq!(bal(&env, &env.vault), 3 * SOL);
    // cannot resolve twice
    assert_err(resolve(&mut env, 0, false, &admin), E::InvalidStatus);
}

#[test]
fn resolve_pay_provider() {
    let mut env = funded_env();
    let client = env.client.insecure_clone();
    dispute(&mut env, 1, &client).unwrap();
    let (p0, t0) = (bal(&env, &env.provider.pubkey()), bal(&env, &env.treasury));
    let admin = env.admin.insecure_clone();
    resolve(&mut env, 1, true, &admin).unwrap();
    let fee = 3 * SOL * 250 / 10_000;
    assert_eq!(bal(&env, &env.treasury) - t0, fee);
    assert_eq!(bal(&env, &env.provider.pubkey()) - p0, 3 * SOL - fee);
    assert_eq!(
        read_agreement(&env).milestones[1].status,
        MilestoneStatus::Released
    );
}

#[test]
fn non_admin_cannot_resolve() {
    let mut env = funded_env();
    let client = env.client.insecure_clone();
    dispute(&mut env, 0, &client).unwrap();
    assert_err(resolve(&mut env, 0, true, &client), E::Unauthorized);
    let attestor = env.attestor.insecure_clone();
    assert_err(resolve(&mut env, 0, true, &attestor), E::Unauthorized);
}

#[test]
fn resolve_requires_disputed() {
    let mut env = funded_env();
    let admin = env.admin.insecure_clone();
    assert_err(resolve(&mut env, 0, true, &admin), E::InvalidStatus);
}

#[test]
fn fee_over_limit_rejected() {
    let mut env = setup();
    assert_err(init_config(&mut env, 1001), E::FeeTooHigh);
    init_config(&mut env, 1000).unwrap();
}

#[test]
fn invalid_agreements_rejected() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    assert_err(create(&mut env, vec![]), E::InvalidMilestones);
    assert_err(create(&mut env, vec![SOL; 9]), E::InvalidMilestones);
    assert_err(create(&mut env, vec![0]), E::InvalidMilestones);
    env.provider = env.client.insecure_clone();
    assert_err(create(&mut env, vec![SOL]), E::SameParty);
}

#[test]
fn dispute_before_funding_rejected() {
    let mut env = setup();
    init_config(&mut env, 250).unwrap();
    create(&mut env, vec![SOL]).unwrap();
    accept(&mut env, HASH).unwrap();
    let client = env.client.insecure_clone();
    assert_err(dispute(&mut env, 0, &client), E::NotFunded);
}

#[test]
fn double_dispute_rejected() {
    let mut env = funded_env();
    let client = env.client.insecure_clone();
    dispute(&mut env, 0, &client).unwrap();
    assert_err(dispute(&mut env, 0, &client), E::InvalidStatus);
    assert_err(dispute(&mut env, 9, &client), E::InvalidIndex);
}

#[test]
fn released_milestone_cannot_be_disputed_or_resolved() {
    let mut env = funded_env();
    let attestor = env.attestor.insecure_clone();
    release(&mut env, 0, &attestor).unwrap();
    let client = env.client.insecure_clone();
    assert_err(dispute(&mut env, 0, &client), E::InvalidStatus);
    let admin = env.admin.insecure_clone();
    assert_err(resolve(&mut env, 0, false, &admin), E::InvalidStatus);
}

#[test]
fn minimum_milestone_amount_covers_provider_rent_at_max_fee() {
    let mut env = setup();
    init_config(&mut env, 1000).unwrap();
    let rent_min = env.svm.minimum_balance_for_rent_exemption(0);
    // Smallest amount whose 90% net share still reaches the rent minimum.
    let min = (rent_min * 10_000).div_ceil(9_000);
    assert_err(create(&mut env, vec![min - 1]), E::InvalidMilestones);
    create(&mut env, vec![min]).unwrap();
}

#[test]
fn status_is_one_byte_tag_in_account_data() {
    let mut env = funded_env();
    let status_at = |env: &Env, i: usize| {
        let data = env.svm.get_account(&env.agreement).unwrap().data;
        // discriminator + client + provider + id + hash + 2 bools + count
        let base = 8 + 32 + 32 + 8 + 32 + 1 + 1 + 1;
        data[base + i * (8 + 1 + 32) + 8]
    };
    assert_eq!(status_at(&env, 0), 0);
    let client = env.client.insecure_clone();
    dispute(&mut env, 0, &client).unwrap();
    assert_eq!(status_at(&env, 0), 2);
    let admin = env.admin.insecure_clone();
    resolve(&mut env, 0, true, &admin).unwrap();
    assert_eq!(status_at(&env, 0), 1);
    dispute(&mut env, 1, &client).unwrap();
    resolve(&mut env, 1, false, &admin).unwrap();
    assert_eq!(status_at(&env, 1), 3);
}
