const tx_util = require("./");
const ethers = require("ethers");

// PK_ADMIN, PK_LIST must be defined in .env
async function main(){
    
    // get pk from .env
    const pk_list = tx_util.configUtils.get_pk();
    const pk_admin = pk_list[0];

    // get accounts from ../config/accounts.json if it doesn't exist,
    // get account addresses from .env(private key -> address)
    const accounts = tx_util.configUtils.get_accounts();

    // get signer
    const url = "http://127.0.0.1:8545";
    const provider = new ethers.providers.JsonRpcProvider(url);
    const signer = new ethers.Wallet(pk_admin,provider);
    // const signer2 = tx_util.get_signer(url,pk_admin); // signer2 == signer

    // if you use hardhat to compile, contract_path is file path which is in contracts directory
    // you can also use openzepplin modules by @openzepplin/blabla
    // info comes from reading compiled output file
    const contract_path = "dir1/dir1_1/contract_file.sol" // you can omit .sol
    const contract_name = "ContractName"

    // deploy contract by assigned signer(+provider)
    const constructor_arguments = []; // if there is no constructor argument
    const deployed_contract = await tx_util.hardhatUtils.deployContract(contract_path,contract_name,signer,constructor_arguments)
    
    // get specific contract by address, abi, provide_or_signer
    const ca_table = tx_util.configUtils.readCA()
    const ca = ca_table[contract_name] // read deployed contract address by contract_name
    const contract_info = tx_util.hardhatUtils.getInfo(contract_path,contract_name) // abi, bytecode and so on..
    const abi = contract_info.abi
    const contract = new ethers.Contract(ca,abi,signer)

    contract.attach(contract_address) // change contract address with same abi
    contract.connect(signer) // change signer

    // overwrite or append contract address
    tx_util.configUtils.writeCA({name:"address"})


    const no_pk_account = "0x"+"0".repeat(40)
    // it can be worked on hardhat node
    const impersonated_signer = tx_util.hardhatUtils.getImpersonatedSigner(provider,no_pk_account)

    // connection checkable provider
    const http_url = url
    const ws_usl = "ws://127.0.0.1:8545"
    const customProvider1 = new tx_util.ethersUtils.ProviderModule(http_url)
    const customProvider2 = new tx_util.ethersUtils.ProviderModule(ws_url)
    let connection1 = await customProvider1.isConnected() // bool
    let connection2 = await customProvider2.isConnected() // bool
    customProvider2.closeConnection(); // ws_url can close the connection


}


