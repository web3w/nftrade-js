import { signatureUtils, ECSignature,assetDataUtils } from '../../../src/order-utils'

const ethUtil = require('ethereumjs-util')

import { JSONRPCErrorCallback, JSONRPCRequestPayload } from 'ethereum-types'

import { joinSignature, verifyMessage, recoverAddress } from 'ethers/lib/utils'
import { isValidECSignature } from '../../../src/utils/signature_utils'


const accountA = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
const priKeyA = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

const orderHash = '0x9c287fb8f2f5155cd7b33473142201ba9ab1514560082d42e46023a2e85e804f'

async function main() {

  const signature0 = signatureUtils.ecSignHashByPrivateKey(priKeyA, orderHash)

  console.log(signature0)
  const fakeProvider = {
    async sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) {
      if (payload.method === 'eth_sign') {
        const [address, message] = payload.params
        console.log(address, message)
        const msgBuff = ethUtil.toBuffer(message)
        const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff)
        const signAddr = ethUtil.bufferToHex(ethUtil.privateToAddress(ethUtil.toBuffer(priKeyA)))
        console.log(signAddr, address)

        const signature = ethUtil.ecsign(prefixedMsgBuff, ethUtil.toBuffer(priKeyA))

        const pubKey = ethUtil.ecrecover(
          prefixedMsgBuff,
          signature.v,
          signature.r,
          signature.s
        )
        const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey))

        if (signAddr !== retrievedAddress) return

        const signRsv: ECSignature = {
          v: signature.v,
          s: ethUtil.bufferToHex(signature.s),
          r: ethUtil.bufferToHex(signature.r)
        }
        // const isValid = isValidECSignature(hashMsg1, signRsv, address)

        // 合约支持的签名类型
        // const signType = signatureUtils.convertECSignatureToSignatureHex(signRsv)
        // console.log(isValid, signType)

        const signatureStr = joinSignature(signRsv)
        callback(null, {
          id: 42,
          jsonrpc: '2.0',
          result: signatureStr
        })
      } else {
        callback(null, { id: 42, jsonrpc: '2.0', result: [accountA] })
      }
    }
  }

  // assetDataUtils.encodeERC20AssetData(tokenAAddress);

  const makerAssetData =  assetDataUtils.encodeERC20AssetData(accountA);

  const signature1 = await signatureUtils.ecSignHashAsync(fakeProvider, orderHash, accountA)


  console.log(signature1)
  //
  //
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
