
const fs = require('fs')
const ethers = require('ethers');
const path = require("path")

const PRE_PATH = path.join(__dirname,"../../")
// const CONFIG_PATH = path.join(PRE_PATH,"./config")

function _read_json(path){
    const data = fs.readFileSync(path);
    return JSON.parse(data.toString())
}

/**
 * 
 * configUtils
 * 
 */

function get_additional_info(what){
    const file_path = path.join(PRE_PATH ,`./config/${what}_info.js`);
    if(fs.existsSync(file_path)){
        return require(file_path)
    } else {
        console.warn("get_additional_info file_path non-exist :", file_path)
        return {}
    }
}

function get_pk(){
    let pks = ""
    try{
        require("dotenv").config({path:path.join(PRE_PATH,"./.env")})
    } catch(err){
        pks = process.env.PK_LIST || "";
    } finally{
        return pks.split(",").filter(pk=>pk.length!=0);
    }
}

function get_accounts(){
    const accounts = []
    const pks = get_pk();
    for(let pk of pks){
        accounts.push(new ethers.Wallet(pk).address)
    }
    return accounts
}


function get_signer(url,priv_k){
    const provider = new ethers.providers.JsonRpcProvider(url)
    const signer = new ethers.Wallet(priv_k,provider)
    return signer
}

function readCA(injected_path){
    const config_path = path.join(PRE_PATH,"./config")
    if(!fs.existsSync(config_path)) fs.mkdirSync(config_path);
    const ca_file_path = injected_path == undefined ? "cached_ca.json" : injected_path;
    const ca_path = path.join(config_path,ca_file_path);
    if(!fs.existsSync(ca_path)) return {}
    return JSON.parse(fs.readFileSync(ca_path).toString())
}

function writeCA(ca){
    const config_path = path.join(PRE_PATH,"./config")
    if(!fs.existsSync(config_path)) fs.mkdirSync(config_path);
    const ca_path = path.join(config_path,"cached_ca.json");
    let ca_new = readCA()
    for(let k in ca){
        ca_new[k] = ca[k]
    }
    fs.writeFileSync(ca_path,JSON.stringify(ca_new))
}

/**
 * 
 *  hardhatUtils
 * 
 */

/**
 * Which path does it return
 * 
 * truffle : contract_path == undefined 
 * hardhat :
 *  - @openzeppelin : contract_path strats with @openzeppelin
 *  - normal contract_path
 */
 function _getCompiledInfoPath(contract_path,contract_name){
    // handle post-fix ".sol"
    if(contract_path!=undefined && contract_path.slice(-4) == ".sol") contract_path = contract_path.slice(0,contract_path.length-".sol".length)
    const truffle_path = path.join(PRE_PATH,`./build/contracts/${contract_name}.json`)
    const hardhat_path = path.join(PRE_PATH,`./artifacts/contracts/${contract_path}.sol/${contract_name}.json`)
    const hardhat_package_path = path.join(PRE_PATH,`./artifacts/${contract_path}.sol/${contract_name}.json`)
    // @openzeppelin, @uniswap,,,
    if(contract_path != undefined && contract_path.slice(0,1) === "@" && fs.existsSync(hardhat_package_path)){
        return hardhat_package_path;
    } else if(contract_path == undefined && fs.existsSync(truffle_path)) return truffle_path;
    else return hardhat_path
}

function getInfo(contract_path,contract_name){
    const info_path = _getCompiledInfoPath(contract_path,contract_name)
    let info = fs.readFileSync(info_path)
    info = JSON.parse(info.toString());
    return info
}

async function deployContract(contract_path,contract_name,signer,[...args]){
    const info = getInfo(contract_path,contract_name)
    const abi = info.abi;
    const bytecode = info.bytecode;
    
    const factory = new ethers.ContractFactory(abi, bytecode, signer)
    const contract = args!=undefined ? await factory.deploy(...args) : await factory.deploy(); 
    await contract.deployed()
    console.log("deploy",contract_name,"on",contract.address)
    return contract
}

async function getImpersonatedSigner(provider,address){
    await provider.send("hardhat_impersonateAccount",[address])
    return provider.getSigner(address);
}

/**
 * 
 *  txUtils
 * 
 */

function makeRawTxData(functionInterface,parameters){
    const signature = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionInterface)).slice(0,10)
    const param_types = functionInterface.split(")")[0].split("(")[1].split(",")
    const data = ethers.utils.defaultAbiCoder.encode(param_types,parameters)
    return signature + data;
}

/**
 * 
 *  ethersUtils
 * 
 */

// function getContract(ca,abi,signer_or_provider){
//     let contract = new ethers.Contract( ca , abi , signer_or_provider)
//     return contract
// }

// function change_signer(contract,priv_k,provider){
//     const signer = new ethers.Wallet(priv_k,provider)
//     return contract.connect(signer)
// }

// function change_contract_addr(contract,contract_address){
//     return contract.attach(contract_address)
// }

/**
 *  ethers provider with isConnected function
 */
class ProviderModule{
    constructor(url){
        this.url = url;
        this.protocol_type = url.split(":")[0]
        this.provider = this.getProvider();
        this.bindingProperties()
        return this.provider
    }
    bindingProperties(){
        const properties = ["url","protocol_type","isWs","isHttp","getProvider","isConnected","closeConnection"]
        for(const p of properties){
            if(!(p in this.provider)){
                this.provider[p] = eval("this."+p);
            } else {
                throw `ProviderModule : provider already has ${p}`
            }
        }
    }

    isWs(){
        return this.protocol_type.includes("ws")
    }
    isHttp(){
        return this.protocol_type.includes("http")
    }

    getProvider(){
        if(this.isHttp()){
            return new ethers.providers.JsonRpcProvider(this.url);
        } else if(this.isWs()){
            const provider = new ethers.providers.WebSocketProvider(this.url)
            provider.websocket.on("error",()=>{})
            return provider;
        } else {
            throw `unexpected protocol_type : ${this.protocol_type}`
        }
    }

    async isConnected(){
        let connection = false;
        try{
            if(this.isHttp()){
                const http = new ethers.providers.JsonRpcProvider(this.url);
                await http.detectNetwork();
                connection = true
            } else if(this.isWs()){
                const ws = new ethers.providers.WebSocketProvider(this.url);
                connection = true;
                ws.websocket.on("error",(err)=> connection=false)
                await ws.destroy()
            }
            return connection;
        } catch (error) {
            return false;
        }
    }
    closeConnection(){
        const provider = this;
        if(this.isWs() && provider.websocket.readyState == 1){
            provider.websocket.close();
        }
    }
}

module.exports = {
    // get config
    configUtils : {
        get_additional_info,
        get_pk,
        get_accounts,
        get_signer,
        readCA,
        writeCA,
    },
    // get contract
    hardhatUtils:{
        getInfo,
        deployContract,
        getImpersonatedSigner,
    },
    // utils
    ethersUtils:{
        ProviderModule
        // getContract
        // change_signer,
        // change_contract_addr,
    },
    txUtils:{
        makeRawTxData
    },
}