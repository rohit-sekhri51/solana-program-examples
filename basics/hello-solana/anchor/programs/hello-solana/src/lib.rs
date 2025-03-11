#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("3LeyxKG26wcrcjiUumj9fHASBGdmgeHDWHSsZd2Cintb");

#[program]
pub mod hello_solana {
    use super::*;

    pub fn hello(_ctx: Context<Hello>) -> Result<()> {
        msg!("Hello, Solana!");

        msg!("Our program's Program ID: {}", &id());

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Hello {}
