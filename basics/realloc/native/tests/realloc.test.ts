import { describe, test } from 'node:test';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { start } from 'solana-bankrun';
import {
  AddressInfo,
  EnhancedAddressInfo,
  WorkInfo,
  createCreateInstruction,
  createReallocateWithoutZeroInitInstruction,
  createReallocateZeroInitInstruction,
} from '../ts';

describe('Realloc!', async () => {
  const PROGRAM_ID = PublicKey.unique();
  const context = await start([{ name: 'realloc_program', programId: PROGRAM_ID }], []);
  const client = context.banksClient;
  const payer = context.payer;

  const testAccount = Keypair.generate();

  test('Create the account with data', async () => {
    console.log(`${testAccount.publicKey}`);
    const ix = createCreateInstruction(testAccount.publicKey, payer.publicKey, PROGRAM_ID, 'Rohit', 222, 'Sector 17', 'Chandigarh');

    const tx = new Transaction();
    tx.recentBlockhash = context.lastBlockhash;
    tx.add(ix).sign(payer, testAccount);
    await client.processTransaction(tx);

    await printAddressInfo(testAccount.publicKey);
  });

  test('Reallocate WITHOUT zero init', async () => {
    const ix = createReallocateWithoutZeroInitInstruction(testAccount.publicKey, payer.publicKey, PROGRAM_ID, 'Punjab', 160051);
    const tx = new Transaction();
    const latestBlockhash = await client.getLatestBlockhash();
    if (!latestBlockhash) {
      throw new Error('Failed to get latest blockhash');
    }
    const [blockHash, _blockHeight] = latestBlockhash;
    tx.recentBlockhash = blockHash;
    tx.add(ix).sign(payer);
    await client.processTransaction(tx);

    await printEnhancedAddressInfo(testAccount.publicKey);
  });

  test('Reallocate WITH zero init', async () => {
    const ix = createReallocateZeroInitInstruction(testAccount.publicKey, payer.publicKey, PROGRAM_ID, 'Sekhri', 'Developer', 'Solana Devs', 2);
    const tx = new Transaction();
    const latestBlockhash = await client.getLatestBlockhash();
    if (!latestBlockhash) {
      throw new Error('Failed to get latest blockhash');
    }
    const [blockHash, _blockHeight] = latestBlockhash;
    tx.recentBlockhash = blockHash;
    tx.add(ix).sign(payer);
    await client.processTransaction(tx);

    await printEnhancedAddressInfo(testAccount.publicKey);
    await printWorkInfo(testAccount.publicKey);
  });

  async function printAddressInfo(pubkey: PublicKey): Promise<void> {
    await sleep(2);
    const data = (await client.getAccount(pubkey))?.data;
    if (data) {
      const addressInfo = AddressInfo.fromBuffer(Buffer.from(data));
      console.log('Address info:');
      console.log(`   Name:       ${addressInfo.name}`);
      console.log(`   House Num:  ${addressInfo.house_number}`);
      console.log(`   Street:     ${addressInfo.street}`);
      console.log(`   City:       ${addressInfo.city}`);
    }
  }

  async function printEnhancedAddressInfo(pubkey: PublicKey): Promise<void> {
    await sleep(2);
    const data = (await client.getAccount(pubkey))?.data;
    if (data) {
      const enhancedAddressInfo = EnhancedAddressInfo.fromBuffer(Buffer.from(data));
      console.log('Enhanced Address info:');
      console.log(`   Name:       ${enhancedAddressInfo.name}`);
      console.log(`   House Num:  ${enhancedAddressInfo.house_number}`);
      console.log(`   Street:     ${enhancedAddressInfo.street}`);
      console.log(`   City:       ${enhancedAddressInfo.city}`);
      console.log(`   State:      ${enhancedAddressInfo.state}`);
      console.log(`   Zip:        ${enhancedAddressInfo.zip}`);
    }
  }

  async function printWorkInfo(pubkey: PublicKey): Promise<void> {
    await sleep(2);
    const data = (await client.getAccount(pubkey))?.data;
    if (data) {
      const workInfo = WorkInfo.fromBuffer(Buffer.from(data));
      console.log('Work info:');
      console.log(`   Name:       ${workInfo.name}`);
      console.log(`   Position:   ${workInfo.position}`);
      console.log(`   Company:    ${workInfo.company}`);
      console.log(`   Years:      ${workInfo.years_employed}`);
    }
  }

  function sleep(s: number) {
    const SECONDS = 1000;
    return new Promise((resolve) => setTimeout(resolve, s * SECONDS));
  }
});
