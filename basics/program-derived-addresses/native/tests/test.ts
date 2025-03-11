import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { BanksClient, ProgramTestContext, start } from 'solana-bankrun';

// Update the PageVisitsData class to match Rust struct
class PageVisitsData {
  page_visits: number;
  bump: number;

  constructor(args: { page_visits: number; bump: number }) {
    this.page_visits = args.page_visits;
    this.bump = args.bump;
  }

  static space(): number {
    return 5; // Matches PageVisits::ACCOUNT_SPACE (8 + 32)
  }
}

// Update the schema to match Rust struct
const PageVisitsSchema = new Map([
  [PageVisitsData, {
    kind: 'struct',
    fields: [
      ['page_visits', 'u32'],
      ['bump', 'u8']
    ]
  }]
]);

// Update the deserialize helper function (add this near the top of the file)
const deserializePageVisits = (data: Uint8Array): PageVisitsData => {
  return borsh.deserialize(
    PageVisitsSchema,
    PageVisitsData,
    Buffer.from(data)
  ) as PageVisitsData;
};

describe('Program Derived Addresses', () => {
  let context: ProgramTestContext;
  let client: BanksClient;
  let payer: Keypair;
  let programId: PublicKey;
  let testUser: Keypair;

  // Update the createPageVisitsBuffer function
  const createPageVisitsBuffer = (pageVisits: number, bump: number): Buffer => {
    const data = borsh.serialize(
      PageVisitsSchema,
      new PageVisitsData({
        page_visits: pageVisits,
        bump: bump
      })
    );
    return Buffer.from(data);
  };

  // Update createIncrementBuffer to match Rust IncrementPageVisits struct
  const createIncrementBuffer = (): Buffer => {
    // Empty struct in Rust, so we just need an empty buffer
    return Buffer.from([]);
  };

  const derivePageVisitsPda = (userPubkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('page_visits'), userPubkey.toBuffer()],
      programId
    );
  };

  beforeEach(async () => {
    programId = PublicKey.unique();
    context = await start(
      [{ name: 'program_derived_addresses_program', programId }],
      []
    );
    client = context.banksClient;
    payer = context.payer;
    testUser = Keypair.generate();
  });

  it('should create a test user account', async () => {
    const rent = await client.getRent();
    const createIx = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: testUser.publicKey,
      lamports: Number(rent.minimumBalance(BigInt(0))),
      space: 0,
      programId: SystemProgram.programId
    });

    const tx = new Transaction()
      .add(createIx);
    tx.recentBlockhash = context.lastBlockhash;
    tx.sign(payer, testUser);

    await client.processTransaction(tx);
    
    const account = await client.getAccount(testUser.publicKey);
    assert.isNotNull(account);
  });

  it('should create page visits PDA and init=0', async () => {
    const [pda, bump] = derivePageVisitsPda(testUser.publicKey);
    
    const createIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: testUser.publicKey, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId,
      data: createPageVisitsBuffer(0, bump)
    });

    const tx = new Transaction().add(createIx);
    tx.recentBlockhash = context.lastBlockhash;
    tx.sign(payer);

    await client.processTransaction(tx);

    // Verify account was created with correct space
    const account = await client.getAccount(pda);
    assert.isNotNull(account);
    assert.equal(account!.data.length, PageVisitsData.space());

    const data = deserializePageVisits(account.data);
    assert.equal(data.page_visits, 0);
  });

  // Then update the increment test
  it('should increment page visits', async () => {
    const [pda, bump] = derivePageVisitsPda(testUser.publicKey);

    // First create the PDA if it doesn't exist
    const createIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: testUser.publicKey, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId,
      data: createPageVisitsBuffer(0, bump)
    });

    let tx = new Transaction().add(createIx);
    tx.recentBlockhash = context.lastBlockhash;
    tx.sign(payer);
    await client.processTransaction(tx);

    // Now get initial value
    const accountBefore = await client.getAccount(pda);
    assert.isNotNull(accountBefore);
    const dataBefore = deserializePageVisits(accountBefore.data);

    // Increment
    const incrementIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true }
      ],
      programId,
      data: createIncrementBuffer()
    });

    tx = new Transaction().add(incrementIx).add(incrementIx).add(incrementIx);
    tx.recentBlockhash = context.lastBlockhash;
    tx.sign(payer);
    await client.processTransaction(tx);

    // Update the verification part
    const accountAfter = await client.getAccount(pda);
    assert.isNotNull(accountAfter);
    const dataAfter = deserializePageVisits(accountAfter.data);
    
    assert.equal(dataAfter.page_visits, dataBefore.page_visits + 3);
  });

  // Update the read test
  it('should read correct number of page visits', async () => {
    const [pda, bump] = derivePageVisitsPda(testUser.publicKey);

    // First create the PDA if it doesn't exist
    const createIx = new TransactionInstruction({
      keys: [
        { pubkey: pda, isSigner: false, isWritable: true },
        { pubkey: testUser.publicKey, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId,
      data: createPageVisitsBuffer(0, bump)
    });

    let tx = new Transaction().add(createIx);
    tx.recentBlockhash = context.lastBlockhash;
    tx.sign(payer);
    await client.processTransaction(tx);

    const account = await client.getAccount(pda);
    assert.isNotNull(account);

    const data = deserializePageVisits(account.data);
    assert.equal(data.page_visits, 0);
  });
});