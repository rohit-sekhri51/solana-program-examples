import { Buffer } from 'node:buffer';
import { describe, test } from 'node:test';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { start } from 'solana-bankrun';

describe('PDAs', async () => {
  const PROGRAM_ID = PublicKey.unique();
  const context = await start([{ name: 'program_derived_addresses_program', programId: PROGRAM_ID }], []);
  const client = context.banksClient;
  const payer = context.payer;
  const rent = await client.getRent();

  class Assignable {
    constructor(properties) {
      for (const [key, value] of Object.entries(properties)) {
        this[key] = value;
      }
    }
  }

  class PageVisits extends Assignable {
    page_visits: number;
    bump: number;

    toBuffer() {
      return Buffer.from(borsh.serialize(PageVisitsSchema, this));
    }

    static fromBuffer(buffer: Buffer) {
      return borsh.deserialize(PageVisitsSchema, PageVisits, buffer);
    }
  }
  const PageVisitsSchema = new Map([
    [
      PageVisits,
      {
        kind: 'struct',
        fields: [
          ['page_visits', 'u32'],
          ['bump', 'u8'],
        ],
      },
    ],
  ]);

  class IncrementPageVisits extends Assignable {
    toBuffer() {
      return Buffer.from(borsh.serialize(IncrementPageVisitsSchema, this));
    }
  }
  const IncrementPageVisitsSchema = new Map([
    [
      IncrementPageVisits,
      {
        kind: 'struct',
        fields: [],
      },
    ],
  ]);

  const testUser = Keypair.generate();

  test('Create a test user', async () => {
    const ix = SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      lamports: Number(rent.minimumBalance(BigInt(0))),
      newAccountPubkey: testUser.publicKey,
      programId: SystemProgram.programId,
      space: 0,
    });

    const tx = new Transaction();
    const blockhash = context.lastBlockhash;
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, testUser); // Add instruction and Sign the transaction

    await client.processTransaction(tx);
    console.log(`Local Wallet: ${payer.publicKey}`);
    console.log(`Created User: ${testUser.publicKey}`);
  });

  function derivePageVisitsPda(userPubkey: PublicKey) {
    return PublicKey.findProgramAddressSync([Buffer.from('page_visits'), userPubkey.toBuffer()], PROGRAM_ID);
  }

  test('Create the page visits tracking PDA', async () => {
    console.log(`Test User PubKey is:  ${testUser.publicKey}`);
    const [pageVisitsPda, pageVisitsBump] = derivePageVisitsPda(testUser.publicKey);
    console.log(`Test User pageVisits PDA  is:  ${pageVisitsPda}`);

    let toBuffer2 = new PageVisits({ page_visits: 0, bump: pageVisitsBump }).toBuffer();
    console.log(`To Buffer 2: ${toBuffer2}`);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pageVisitsPda, isSigner: false, isWritable: true },
        { pubkey: testUser.publicKey, isSigner: false, isWritable: false },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: toBuffer2,
    });

    console.log(` ${pageVisitsBump} Done BORSH S-deS ${PROGRAM_ID}`);
    const tx = new Transaction();
    const blockhash = context.lastBlockhash;
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer);

    console.log(`Signed and Added the transaction 2`);
    let sgx = await client.processTransaction(tx); 
    // client.processTransaction(tx).then((res) => {
    //   console.log(`Page visits eRRR Sgx: ${res}`);
    // });

    console.log(`Page visits errrrrrrrrr PDA: ${pageVisitsPda}`);
    console.log(`Page visits eRRR Sgx: ${sgx}`);
  });

  test('Visit the page!', async () => {
    const [pageVisitsPda, _] = derivePageVisitsPda(testUser.publicKey);
    console.log(`Test User pageVisits PDA  is:  ${pageVisitsPda}`);

    const toBuffer3 = new IncrementPageVisits({}).toBuffer();
    console.log(`To Buffer 3: ${toBuffer3}`);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pageVisitsPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: toBuffer3,
    });
    const tx = new Transaction();
    const blockhash = context.lastBlockhash;
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer);

    console.log(`Signed and Added the transaction 3`);

    await client.processTransaction(tx);
    console.log(`After Process transaction 3`);
  });

  test('Visit the page!', async () => {
    const [pageVisitsPda, _] = derivePageVisitsPda(testUser.publicKey);
    console.log(`Test User pageVisits PDA  is:  ${pageVisitsPda}`);

    let toBuffer4 = new IncrementPageVisits({}).toBuffer();
    console.log(`To Buffer 4: ${toBuffer4}`);

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pageVisitsPda, isSigner: false, isWritable: true },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      ],
      programId: PROGRAM_ID,
      data: toBuffer4,
    });
    const tx = new Transaction();
    const [blockhash, _block_height] = await client.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer);

    console.log(`Signed and Added the transaction 4`);

    await client.processTransaction(tx);
    console.log(`After Process transaction 4`);
  });

  test('Read page visits', async () => {

    const [pageVisitsPda, _] = derivePageVisitsPda(testUser.publicKey);
    console.log(`Test User pageVisits PDA  is:  ${pageVisitsPda}`);

    const accountInfo = await client.getAccount(pageVisitsPda);
    if (accountInfo === null) {
      throw new Error('Errorrrrrrrrrrrrr: cannot find the account');
    }
    const readPageVisits = PageVisits.fromBuffer(Buffer.from(accountInfo.data));
    console.log(`Number of page visits: ${readPageVisits.page_visits}`);
  });
}); 