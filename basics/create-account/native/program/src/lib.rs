use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    native_token::LAMPORTS_PER_SOL,
    program::invoke,
    pubkey::Pubkey,
    system_instruction, system_program,
};

entrypoint!(process_instruction);

// target/so/program.so is the output of the build process
// this is the entry point of the program
// GFKh38EB9Eu5N2VjckSd7cifQkHbWf7zVDgqxM2nowmY confirmed Keypair.fromSecretKey(Uint8Array.from(arry));
// target PublicKey: explorer says executable flag as yes.

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let new_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    msg!("Program invoked. Creating a system account...");
    msg!("  New public key will be: {}", &new_account.key.to_string());

    // invoke system instruction to create a new account
    // invoke instruction is used to call another program from the current program
    // therefore we are calling it CPI (Cross Program Invocation)
    invoke(
        &system_instruction::create_account(
            payer.key,
            new_account.key,
            2 * LAMPORTS_PER_SOL,
            0,
            &system_program::ID,
        ),
        &[payer.clone(), new_account.clone(), system_program.clone()],
    )?;

    msg!("Account created succesfully.");
    Ok(())
}
