import { describe, test } from 'node:test';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { start } from 'solana-bankrun';

// tests/fixtures/program.json contains UnitArray with point to below Public Key.
// GbjKRrzqUZ3usUcNUCjJtTK3SrMhQJtYrCTNDPLzr2AY. explorer says account does not exist.
// why ? target PublicKey is different from the above PublicKey
// target PublicKey: explorer says executable flag as yes.
// const PROGRAM_ID = new PublicKey('GbjKRrzqUZ3usUcNUCjJtTK3SrMhQJtYrCTNDPLzr2AY'); // Unique program id

describe('Create a system account', async () => {
  const PROGRAM_ID = PublicKey.unique();  // Unique program id
  const context = await start([{ name: 'create_account_program', programId: PROGRAM_ID }], []);   // Start the bankrun
  const client = context.banksClient;
  const payer = context.payer;

  test('Create the account via a cross program invocation', async () => {
    const newKeypair = Keypair.generate();
    const blockhash = context.lastBlockhash;

    const ix = new TransactionInstruction({ // Create a new account with CPI w/o bump seed
      keys: [
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: newKeypair.publicKey, isSigner: true, isWritable: true }, // Why isSigner: true? and isWritable: true?
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.alloc(0),
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, newKeypair);

    await client.processTransaction(tx);
    console.log(`Account CPI with publickey ${newKeypair.publicKey} success`);  // Print the public key of the new account

    // await sendAndConfirmTransaction(
    //   connection,
    //   new Transaction().add(ix),
    //   [payer, newKeypair],
    //   { commitment: 'singleGossip' },
    // );

  });

  test('Create the account via direct call to system program', async () => {
    const newKeypair = Keypair.generate();
    const blockhash = context.lastBlockhash;

    const ix = SystemProgram.createAccount({  // Create a new account
      fromPubkey: payer.publicKey,
      newAccountPubkey: newKeypair.publicKey,
      lamports: LAMPORTS_PER_SOL,
      space: 0,
      programId: SystemProgram.programId,
    });

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, newKeypair);

    await client.processTransaction(tx);
    console.log(`Account with public key ${newKeypair.publicKey} successfully created`);
  });
});
