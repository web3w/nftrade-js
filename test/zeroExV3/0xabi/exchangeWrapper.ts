import { signatureUtils, ECSignature } from '../../../src/order-utils'

// const ethUtil = require('ethereumjs-util')

import * as ethUtil from 'ethereumjs-util'

import { ethers, providers } from 'ethers'
import { JSONRPCErrorCallback, JSONRPCRequestPayload } from 'ethereum-types'

import { infuraKey, accounts } from '../../../../secrets.json'
import { joinSignature, verifyMessage, recoverAddress } from 'ethers/lib/utils'
import { isValidECSignature } from '../../../src/utils/signature_utils'

const taker = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const privatekey = accounts[taker]

const priKeyA = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

async function main() {
  const provider = new providers.InfuraProvider('rinkeby', infuraKey)
  const { chainId } = await provider.getNetwork()
  const wallet = new ethers.Wallet(priKeyA)

  // 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 0x9c287fb8f2f5155cd7b33473142201ba9ab1514560082d42e46023a2e85e804f
  // 0x40194684a28ac7b1c10ce349b935b319ec66886b9e9011f8bc6798918b26089524914e6623986ca376749d5e9afdd2b95b1c10f38c418bf21f07a1f4dbcc124d1c

  const accountA = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
  const orderHash = '0x9c287fb8f2f5155cd7b33473142201ba9ab1514560082d42e46023a2e85e804f'
  const fakeProvider = {
    async sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) {
      if (payload.method === 'eth_sign') {
        const [address, message] = payload.params
        console.log(address, message)

        const hashMsg1 = signatureUtils.addSignedMessagePrefix(message)


        const hashAddr = ethers.utils.keccak256(hashMsg1)
        const binaryData = ethers.utils.arrayify(hashAddr)
        // const signature = await wallet.signMessage(binaryData)

        const address1 = ethUtil.privateToAddress(ethUtil.toBuffer(priKeyA))
        const sig = ethUtil.ecsign(ethUtil.toBuffer(hashMsg1), ethUtil.toBuffer(priKeyA))

        console.log(ethUtil.bufferToHex(address1), address)
        console.log('R', ethUtil.bufferToHex(sig.r))
        console.log('S', ethUtil.bufferToHex(sig.s))
        console.log('V', sig.v)

        const signRsv: ECSignature = {
          v: sig.v,
          s: ethUtil.bufferToHex(sig.s),
          r: ethUtil.bufferToHex(sig.r)
        }

        const isValid = isValidECSignature(hashMsg1, signRsv, address)

        const signType = signatureUtils.convertECSignatureToSignatureHex(signRsv)

        console.log(isValid, signType)


        // const accountSign = verifyMessage(binaryData,signature)
        const hashMsg = ethers.utils.hashMessage(message)
        const signSrv = wallet._signingKey().signDigest(binaryData)
        console.log(hashMsg1, signSrv)
        const signature = joinSignature(signRsv)

        const addr = recoverAddress(binaryData, signature)


        console.log(addr, accountA)
        callback(null, {
          id: 42,
          jsonrpc: '2.0',
          result: signature
        })
      } else {
        callback(null, { id: 42, jsonrpc: '2.0', result: [accountA] })
      }
    }
  }

  const signature1 = await signatureUtils.ecSignHashAsync(fakeProvider, orderHash, accountA)


  console.log(signature1)
  //
  //
  // const order = {
  //   exchangeAddress: contractWrappers.exchange.address,
  //   makerAddress: maker,//address of maker
  //   takerAddress: taker,//address of taker
  //   senderAddress: taker,//address of sender
  //   feeRecipientAddress: NULL_ADDRESS,//fee in the form of native currency of platform
  //   expirationTimeSeconds: randomExpiration,//expire time of order
  //   salt: generatePseudoRandomSalt(),//random no to differentiate order
  //   makerAssetAmount,//maker asset amount
  //   takerAssetAmount,//taker asset amount
  //   makerAssetData,//encoded address of tokenA
  //   takerAssetData,//encoded address of tokenB
  //   makerFee: ZERO,//fee if required
  //   takerFee: ZERO,//fee if required
  // };

  // const filledAmount = await contractWrappers.exchange.getOrderInfo("0x123").callAsync();

  // https://0x.org/docs/core-concepts#smart-contract-accounts
  // transactionCost = gasUsedByTransaction * gasPriceSenderIsWillingToPay
  // next
  // const filledAmount = await contractWrappers.exchange.filled("0x123").callAsync();
  // console.log(filledAmount)

  // const txReceipt = await contractWrappers.exchange
  //   .cancelOrder(order)
  //   .awaitTransactionSuccessAsync({ from: order.makerAddress });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
