import { Buffer } from 'node:buffer';
import { describe, test, before } from 'node:test';
import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { start } from 'solana-bankrun';


class InstructionData {
  name: string;
  height: number;

  constructor(props: { name: string; height: number }) {
    this.name = props.name;
    this.height = props.height;
  }

  static schema = new Map([
    [
      InstructionData,
      {
        kind: 'struct',
        fields: [
          ['name', 'string'],
          ['height', 'u32'],
        ],
      },
    ],
  ]);

  serialize(): Buffer {
    return Buffer.from(borsh.serialize(InstructionData.schema, this));
  }
}

describe('custom-instruction-data', () => {
  let PROGRAM_ID: PublicKey;
  let context: any;
  let client: any;
  let payer: Keypair;

  before(async () => {
    PROGRAM_ID = PublicKey.unique();
    context = await start([{ name: 'processing_instructions_program', programId: PROGRAM_ID }], []);
    client = context.banksClient;
    payer = context.payer;
  });

  test('Go to the park!', async () => {
    // Get blockhash first
    const latestBlockhash = await client.getLatestBlockhash();
    console.log('Blockhash response:', latestBlockhash);

    // Create transaction with proper initialization
    const tx = new Transaction();
    tx.feePayer = payer.publicKey;
    tx.recentBlockhash = latestBlockhash[0];
    console.log('Tx Blockhash response:', latestBlockhash[0]);
    
    const dhruv = new InstructionData({
      name: 'Dhruv',
      height: 3,
    });

    const akash = new InstructionData({
      name: 'Akash',
      height: 10,
    });

    // Add instructions
    const ix1 = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: PROGRAM_ID,
      data: dhruv.serialize(),
    });

    const ix2 = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: PROGRAM_ID,
      data: akash.serialize(),
    });

    tx.add(ix1, ix2);

    // Debug logs
    console.log('Transaction details:');
    console.log('- Blockhash:', tx.recentBlockhash);
    console.log('- Fee payer:', tx.feePayer.toBase58());
    console.log('- Instructions:', tx.instructions.length);
    
    // Sign and send
    try {
      tx.sign(payer);
      const txid = await client.processTransaction(tx);
      console.log('Transaction processed successfully');
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
});
