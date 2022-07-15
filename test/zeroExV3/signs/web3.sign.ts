import Web3 from 'web3'
import secrets from '../../../../secrets.json'

const addressList:string[] = [
  "0xDb093eA18823a867f5a28D335d9142AEd3979fE9",
];

(async () => {
  // const rpcUrl = `https://rinkeby.infura.io/v3/${secrets.infuraKey}`
  const web3 = new Web3()

  const signer = web3.eth.accounts.wallet.add(secrets.accounts['0x32f4B63A46c1D12AD82cABC778D75aBF9889821a'])
  try {

    const logCsv = addressList.map(async (address:string) => {
      const hashAddr = web3.utils.sha3(address)
      const web3AccountSignature =await  web3.eth.accounts.sign(hashAddr || '', signer.privateKey || '')
      const signature = web3AccountSignature.signature
      console.log("web3AccountSignature",signature)
      web3.eth.defaultAccount = signer.address
      const web3EthSignature =await web3.eth.sign(hashAddr || '', signer.address)
      console.log("web3EthSignature",web3EthSignature)
    })
    // console.log(logCsv)
    // await writeCsv(__dirname+"new.csv",logCsv)

  } catch (e) {

  }
})()
