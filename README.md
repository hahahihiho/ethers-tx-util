
what you need to prepare
- .env : 
    - PK_LIST=0x~,0x~,0x~...

- set PRE_PATH in tx_util.js : path for config, .env

function lists

- get_accounts() : get account list which is made by .env private keys

- get_pk() : get pk from .env

- get_signer(url,pk)

- deployContract(contract_path,contract_name,signer,constructor_arguments)
: 
    - contract_path = "myContractsDir/firstContract.sol" // file_path
    - contract_name = "ContractName" // contract name written in .sol file
    - constructor_arguments = [] // no argument

- readCA()[contract_name] : get deployed contract addresses

- getInfo(contract_path,contract_name) : it contains abi, bytecodes, and so on.

- getImpersonatedSigner(provider,address) : approve unknown address and get signer(works on hardhat node)


