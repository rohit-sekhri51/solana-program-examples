use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program::invoke,
    pubkey::Pubkey,
    system_instruction,
};

// transfer_sol_with_cpi is a function that transfers lamports from one account to another
pub fn transfer_sol_with_cpi(accounts: &[AccountInfo], amount: u64) -> ProgramResult {  // using the system program
    let accounts_iter = &mut accounts.iter();           
    let payer = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?; // system_program is the system program

    invoke(
        &system_instruction::transfer(payer.key, recipient.key, amount),
        &[payer.clone(), recipient.clone(), system_program.clone()],
    )?;

    Ok(())
}

// not used, hence "_". Why? Because the program is already running and we don't need to pass the program
pub fn transfer_sol_with_program(   // transfer_sol_with_program is a function that transfers lamports from one account to another       
    _program_id: &Pubkey,           // using the system program
    accounts: &[AccountInfo],       // accounts is a slice of AccountInfo structs
    amount: u64,                    // amount is the number of lamports to transfer
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let payer = next_account_info(accounts_iter)?;
    let recipient = next_account_info(accounts_iter)?;

    **payer.try_borrow_mut_lamports()? -= amount;
    **recipient.try_borrow_mut_lamports()? += amount;

    Ok(())
}
