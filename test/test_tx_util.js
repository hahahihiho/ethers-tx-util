const tx_util = require("../");

// PK_ADMIN, PK_LIST must be defined in .env
function testConfigUtils(){
    // get pk from .env
    const pks = tx_util.configUtils.get_pk()
    console.log(pks)

    // get accounts from ../config/accounts.json if it doesn't exist,
    // get account addresses from .env(private key -> address)
    const accounts = tx_util.configUtils.get_accounts();
    console.log(accounts);
}

async function testHardhatUtils(){
    const url = "http://127.0.0.1:8545"
    const pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // hardhat test priv_key
    const signer = tx_util.configUtils.get_signer(url,pk)
    await tx_util.hardhatUtils.deployContract("Greeter.sol","Greeter",signer,["Hello"])
    await tx_util.hardhatUtils.deployContract("Greeter2.sol","Greeter2",signer)
}

async function testEthersUtils(){
    const url_list = ["http://127.0.0.1:8545","http://127.0.0.1:8546","ws://127.0.0.1:8545","ws://127.0.0.1:8546"]
    for(const url of url_list){
        const provider = new tx_util.ethersUtils.ProviderModule(url)
        const connection = await provider.isConnected();
        console.log(url,"is connected : ",connection);
        provider.closeConnection();
    }
}

async function main(){
    testConfigUtils()
    testEthersUtils()
    // testHardhatUtils()
}

main();

