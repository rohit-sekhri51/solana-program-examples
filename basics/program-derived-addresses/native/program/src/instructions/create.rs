use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program::invoke_signed,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
    msg,
};

use crate::state::PageVisits;

pub fn create_page_visits(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    page_visits: PageVisits,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let page_visits_account = next_account_info(accounts_iter)?;    // The account to be created
    let user = next_account_info(accounts_iter)?;   // The user account of the page visits account
    let payer = next_account_info(accounts_iter)?;  // The account that will pay for the account creation
    let system_program = next_account_info(accounts_iter)?;   // The system program account

    let account_span = (page_visits.try_to_vec()?).len();
    let lamports_required = (Rent::get()?).minimum_balance(account_span);

    msg!("Program Id: {:?}", program_id); // The program id of the program (smart contract) 1112
    msg!("PDA: {:?}", page_visits_account.key); // The Program Derived Address
    msg!("PDA Owner: {:?}", page_visits_account.owner); //System Program 11111111111111111111111111111111
    msg!("User: {:?}", user.key);
    msg!("Payer: {:?}", payer.key);
    msg!("System Program: {:?}", system_program.key);  // System Program 11111111111111111111111111111111
    msg!("Lamports required: {:?}", lamports_required);
    msg!("Account span: {:?}", account_span);

    invoke_signed(      // In case of Program Derived Addresses, we need to use invoke_signed
        &system_instruction::create_account(
            payer.key,
            page_visits_account.key,
            lamports_required,
            account_span as u64,
            program_id,
        ),
        &[
            payer.clone(),
            page_visits_account.clone(),
            system_program.clone(),
        ],
        &[&[
            PageVisits::SEED_PREFIX.as_bytes(),
            user.key.as_ref(),
            &[page_visits.bump],
        ]],
    )?;

    Ok(())
}
