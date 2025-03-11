use crate::instructions::*;
use crate::state::*;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum ReallocInstruction {
    Create(AddressInfo),        // <1>
    ReallocateWithoutZeroInit(EnhancedAddressInfoExtender),     // <2>
    ReallocateZeroInit(WorkInfo),       // <3>
}

pub fn process_instruction(
    program_id: &Pubkey,    // Program ID / Address / Smart Contract Address
    accounts: &[AccountInfo],
    input: &[u8],       // 1 or 2 or 3
) -> ProgramResult {
    let instruction = ReallocInstruction::try_from_slice(input)?;
    match instruction {
        ReallocInstruction::Create(data) => create_address_info(program_id, accounts, data), // <1> 
        ReallocInstruction::ReallocateWithoutZeroInit(data) => {
            reallocate_without_zero_init(accounts, data)    // <2>
        }
        ReallocInstruction::ReallocateZeroInit(data) => reallocate_zero_init(accounts, data), // <3>
    }
}
