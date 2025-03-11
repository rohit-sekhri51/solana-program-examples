
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
};

use crate::state::PageVisits;

pub fn increment_page_visits(accounts: &[AccountInfo]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let page_visits_account = next_account_info(accounts_iter)?;

    let khali: bool   = page_visits_account.try_data_is_empty()?;

    if khali {
        return Err(solana_program::program_error::ProgramError::InvalidAccountData);
    }

    let page_visits = &mut PageVisits::try_from_slice(&page_visits_account.data.borrow())?;
    page_visits.increment();
    page_visits.serialize(&mut &mut page_visits_account.data.borrow_mut()[..])?;    // Confusing ????
    // Why serialize? Because we need to update the account data with the new value of page visits
    // Why serialize to the same account data? Because we are updating the same account data
    // abc
    Ok(())
}
