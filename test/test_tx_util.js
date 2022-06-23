const tx_util = require("../tx_util");
const ethers = require("ethers");
const hre = require("hardhat")

// PK_ADMIN, PK_LIST must be defined in .env
async function main(){
    
    // get pk from .env
    const pks = tx_util.get_pk()
    const pk_list = pks.PK_LIST;
    console.log(pk_list)

    // get accounts from ../config/accounts.json if it doesn't exist,
    // get account addresses from .env(private key -> address)
    const accounts = tx_util.get_accounts();
    console.log(accounts);
    const ca = tx_util.get_contract_addresses();
    console.log(ca)

}

main();

