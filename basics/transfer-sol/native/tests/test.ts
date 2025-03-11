import { describe, test } from 'node:test';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { start } from 'solana-bankrun';
import { InstructionType, createTransferInstruction } from './instruction';

describe('transfer-sol', async () => {
  const PROGRAM_ID = PublicKey.unique();
  const context = await start([{ name: 'transfer_sol_program', programId: PROGRAM_ID }], []);
  const client = context.banksClient;
  const payer = context.payer;

  const transferAmount = 3 * LAMPORTS_PER_SOL;
  const test1Recipient = Keypair.generate();
  const test2Recipient1 = Keypair.generate();
  const test2Recipient2 = Keypair.generate();

  test('Transfer between accounts using the system program CPI', async () => {
    await getBalances(payer.publicKey, test1Recipient.publicKey, 'Beginning');

    const ix = createTransferInstruction(payer.publicKey, test1Recipient.publicKey, PROGRAM_ID, InstructionType.CpiTransfer, transferAmount);

    const tx = new Transaction();
    const [blockhash, _] = await client.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer);

    await client.processTransaction(tx);

    await getBalances(payer.publicKey, test1Recipient.publicKey, 'Resulting'); // test1Recipient has 3 SOL
    // The balances should be the same as the beginning because the system program CPI doesn't actually transfer funds between accounts
    // It only checks if the accounts have enough funds to transfer
    // The actual transfer is done by the system program itself
    // The balances are the same because the system program doesn't actually transfer funds between accounts
  });

  test('Create two accounts for the following test', async () => {
    const ix = (pubkey: PublicKey) => {
      return SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: pubkey,
        space: 0,
        lamports: 10 * LAMPORTS_PER_SOL,
        programId: PROGRAM_ID,
      });
    };

    const tx = new Transaction();
    const [blockhash, _] = await client.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.add(ix(test2Recipient1.publicKey)).add(ix(test2Recipient2.publicKey)).sign(payer, test2Recipient1, test2Recipient2);

    await client.processTransaction(tx);  // test2Recipient1, test2Recipient2 has 10 SOL
  });

  test('Transfer between accounts using our program', async () => {
    await getBalances(test2Recipient1.publicKey, test2Recipient2.publicKey, 'Beginning'); // test2Recipient1, test2Recipient2 has 10 SOL

    const ix = createTransferInstruction(
      test2Recipient1.publicKey,
      test2Recipient2.publicKey,
      PROGRAM_ID,
      InstructionType.ProgramTransfer,
      transferAmount,
    );

    const tx = new Transaction();
    const [blockhash, _] = await client.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, test2Recipient1);

    await client.processTransaction(tx);

    await getBalances(test2Recipient1.publicKey, test2Recipient2.publicKey, 'Resulting');
    // test2Recipient1 has 7 SOL, test2Recipient2 has 13 SOL
    // The balances are different because the program actually transfers funds between accounts
  });

  async function getBalances(payerPubkey: PublicKey, recipientPubkey: PublicKey, timeframe: string) {
    const payerBalance = await client.getBalance(payerPubkey);
    const recipientBalance = await client.getBalance(recipientPubkey);

    console.log(`${timeframe} balances:`);
    console.log(`   Payer: ${payerBalance}`);
    console.log(`   Recipient: ${recipientBalance}`);
  }
});
