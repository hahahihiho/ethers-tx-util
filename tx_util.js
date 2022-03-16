
const fs = require('fs')
const ethers = require('ethers');
const path = require("path")

function _read_json(path){
    const data = fs.readFileSync(path);
    return JSON.parse(data.toString())
}

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
    const truffle_path = path.join(__dirname,`../build/contracts/${contract_name}.json`)
    const hardhat_path = path.join(__dirname,`../artifacts/contracts/${contract_path}.sol/${contract_name}.json`)
    const hardhat_openzeppelin_path = path.join(__dirname,`../artifacts/${contract_path}.sol/${contract_name}.json`)
    if(contract_path != undefined && contract_path.slice(0,"@openzeppelin".length) == "@openzeppelin" && fs.existsSync(hardhat_openzeppelin_path)){
        return hardhat_openzeppelin_path;
    } else if(contract_path == undefined && fs.existsSync(truffle_path)) return truffle_path;
    else return hardhat_path
}

function get_contract_addresses(){
    const file_path = path.join(__dirname ,"../config/contract_addresses.js");
    const CAs = require(file_path)
    return CAs
}

function get_additional_info(){
    const config = require(path.join(__dirname ,"../config/additional_info.js"));
    return config
}

function get_accounts(){
    const file_path = path.join(__dirname,"../config/accounts.json");
    if(!fs.existsSync(file_path)){
        const accounts = {}
        require("dotenv").config(path.join(__dirname,"../.env"))
        accounts['admin_accounts'] = new ethers.Wallet(process.env.PK_ADMIN).address;
        accounts['test_accounts'] = []
        for(let pk of process.env.PK_LIST.split(",")){
            accounts['test_accounts'].push(new ethers.Wallet(pk).address)
        }
        fs.writeFileSync(file_path,JSON.stringify(accounts))
    }
    return _read_json(file_path)
}

function get_pk(){
    require("dotenv").config(path.join(__dirname,"../.env"))
    let result = {
        PK_ADMIN : process.env.PK_ADMIN,
        PK_LIST : process.env.PK_LIST.split(",")
    }
    return result
}

function get_signer(url,priv_k){
    const provider = new ethers.providers.JsonRpcProvider(url)
    const signer = new ethers.Wallet(priv_k,provider)
    return signer
}

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

async function deployContract(contract_path,contract_name,signer,[...args]){
    const info = getInfo(contract_path,contract_name)
    const abi = info.abi;
    const bytecode = info.bytecode;
    
    const ca = {}
    const factory = new ethers.ContractFactory(abi, bytecode, signer)
    const contract = await factory.deploy(...args)
    ca[contract_name] = contract.address
    writeCA(ca)
    console.log("deploy",contract_name,"on",contract.address)
    return contract
}

function getInfo(contract_path,contract_name){
    const info_path = _getCompiledInfoPath(contract_path,contract_name)
    let info = fs.readFileSync(info_path)
    info = JSON.parse(info.toString());
    return info
}

function readCA(){
    const config_path = path.join(__dirname,"../config")
    if(!fs.existsSync(config_path)) fs.mkdirSync(config_path);
    const ca_path = path.join(config_path,"deployed_ca.json");
    if(!fs.existsSync(ca_path)) return {}
    return JSON.parse(fs.readFileSync(ca_path).toString())
}

function writeCA(ca){
    const config_path = path.join(__dirname,"../config")
    if(!fs.existsSync(config_path)) fs.mkdirSync(config_path);
    const ca_path = path.join(config_path,"deployed_ca.json");
    let ca_new = readCA()
    for(let k in ca){
        ca_new[k] = ca[k]
    }
    fs.writeFileSync(ca_path,JSON.stringify(ca_new))
}

async function getImpersonatedSigner(provider,address){
    await provider.send("hardhat_impersonateAccount",[address])
    return provider.getSigner(address);
}

module.exports = {
    // get config
    get_contract_addresses,
    get_additional_info,
    get_accounts,
    get_pk,
    get_signer,
    readCA,
    writeCA,
    // get contract
    getInfo,
    deployContract,
    // util
    getImpersonatedSigner
    // getContract
    // change_signer,
    // change_contract_addr 
}