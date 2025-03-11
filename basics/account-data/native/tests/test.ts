import { Buffer } from 'node:buffer';
import { describe, test } from 'node:test';
import { Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as borsh from 'borsh';
import { start } from 'solana-bankrun';

class Assignable {    // Assignable class is used to assign the properties to the class
  constructor(properties) {
    for (const [key, value] of Object.entries(properties)) {
      this[key] = value;
    }
  }
}

class AddressInfo extends Assignable {
  street: any;
  city: any;
  name: any;
  house_number: any;
  toBuffer() {
    return Buffer.from(borsh.serialize(AddressInfoSchema, this));
  }

  static fromBuffer(buffer: Buffer) {
    return borsh.deserialize(AddressInfoSchema, AddressInfo, buffer);
  }
}
const AddressInfoSchema = new Map([
  [
    AddressInfo,        // Format is NOT Typescript but Borsh format
    {                   // AddressInfo is a class which is used to define the schema of the data
      kind: 'struct',   // kind is used to define the type of the data
      fields: [         // fields is used to define the properties of the data
        ['name', 'string'],
        ['house_number', 'u8'],
        ['street', 'string'],
        ['city', 'string'],
      ],
    },
  ],
]);

describe('Account Data!', async () => {
  const addressInfoAccount = Keypair.generate();
  const PROGRAM_ID = PublicKey.unique();
  const context = await start([{ name: 'account_data_program', programId: PROGRAM_ID }], []);
  const client = context.banksClient;

  test('Create the address info account', async () => {
    const payer = context.payer;

    console.log(`Program Address      : ${PROGRAM_ID}`);    // It is not SystemProgram.programId but any random ProgramId
    console.log(`Payer Address      : ${payer.publicKey}`); // It is the address of the payer
    console.log(`Address Info Acct  : ${addressInfoAccount.publicKey}`);  
    // It is the address of the account, which will store the data, which is created by the payer
    // Not present, just created for the sake of testing

    const ix = new TransactionInstruction({
      keys: [
        {
          pubkey: addressInfoAccount.publicKey,
          isSigner: true,
          isWritable: true,
        },
        { pubkey: payer.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: new AddressInfo({
        name: 'Rohit Sekhri',
        house_number: 251,
        street: 'Sector 12A',
        city: 'Panchkula',
      }).toBuffer(),
      // buffer is used to covert into array of bytes
    });

    const blockhash = context.lastBlockhash;

    const tx = new Transaction();
    tx.recentBlockhash = blockhash;
    tx.add(ix).sign(payer, addressInfoAccount);
    await client.processTransaction(tx);
  });

  test("Read the new account's data", async () => {
    const accountInfo = await client.getAccount(addressInfoAccount.publicKey);

    const readAddressInfo = AddressInfo.fromBuffer(Buffer.from(accountInfo.data));
    console.log(`Name     : ${readAddressInfo.name}`);
    console.log(`House Number: ${readAddressInfo.house_number}`);
    console.log(`Street   : ${readAddressInfo.street}`);
    console.log(`City     : ${readAddressInfo.city}`);
  });
});
