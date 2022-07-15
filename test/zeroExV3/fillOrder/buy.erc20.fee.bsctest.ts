
import { ethers } from 'ethers'
import { ContractBase } from '../../../src/contracts'
import secrets from '../../../../secrets.json'
import { FormatTypes } from 'ethers/lib/utils'
import { BaseOrder, Order, OrderStatus, SignedOrder,BigNumber } from '@txdev/0x-utils'
import { ZeroExOrder } from '../../../src/zeroExOrder'
import { ZeroExchange } from '../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../src/order-utils'
import { Account } from '../../../src/account'


const NULL_ADDRESS = ethers.constants.AddressZero
const sellAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const tokenId = new BigNumber('1')
const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn50 = new BigNumber('500')

const bn200 = new BigNumber('200')


const bscTestMockAsset = {
    'erc20': '0x26afe7885cdcff35ade8498bd183577dc98e3fcc',
    'erc721': '0x066561b3369fa33E56D58C3fcE621FF82B4Cdd3F',
    'erc1155': '0x2a3eCaeA2A31bb34e84835Bd6799614304AaFa5F'
  }


;(async () => {
  try {
    // const wallet = new ethers.Wallet(secrets.accounts[buyAccount], provider)
    const erc721AssetData = assetDataUtils.encodeERC721AssetData(bscTestMockAsset.erc721, tokenId)
    const erc20AssetData = assetDataUtils.encodeERC20AssetData(bscTestMockAsset.erc20)


    const chainId = 97
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })


    const feeAddr = '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
    const { salt, expirationTimeSeconds } = orderHashUtils.computerExpirationAndSalt(0)
    const order_fee = {
      makerAddress: sellAccount,
      takerAddress: NULL_ADDRESS,
      feeRecipientAddress: feeAddr,
      senderAddress: NULL_ADDRESS,
      makerAssetAmount: bn1,
      takerAssetAmount: bn200,
      makerFee: bn0,
      takerFee: bn50,
      expirationTimeSeconds,
      salt,
      takerAssetData: erc20AssetData,
      makerAssetData: erc721AssetData,
      makerFeeAssetData: '0x',
      takerFeeAssetData: erc20AssetData
    }

    const signedOrder = await sellContract.orderHashSign(order_fee)


    // {
    //   "makerAddress": "0x9f7a946d935c8efc7a8329c0d894a69ba241345a",
    //   "takerAddress": "0x0000000000000000000000000000000000000000",
    //   "feeRecipientAddress": "0x0000000000000000000000000000000000000000",
    //   "senderAddress": "0x0000000000000000000000000000000000000000",
    //   "makerAssetAmount": "1",
    //   "takerAssetAmount": "100000000000000",
    //   "makerFee": "0",
    //   "takerFee": "0",
    //   "expirationTimeSeconds": "1638773502",
    //   "salt": "1638168702",
    //   "makerAssetData": "0x02571792000000000000000000000000066561b3369fa33e56d58c3fce621ff82b4cdd3f0000000000000000000000000000000000000000000000000000000000000003",
    //   "takerAssetData": "0xf47261b0000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd",
    //   "makerFeeAssetData": "0x",
    //   "takerFeeAssetData": "0xf47261b0000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd",
    //   "exchangeAddress": "0x608fe87aff927F6AfCC271A21Ee8E676cbaC90B3",
    //   "chainId": "97",
    //   "signature": "0x1c2807baf83010188c7d39b7c045abcb9c17eb29c397e25393366b23fcbb1f494661ec5c726546a0e8ad5071fb15af4259857928f447e4c4b49fd009ca5236648202"
    // }


    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })


    const userAccount = new Account({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })

    const allow = await userAccount.getERC721Allowance(bscTestMockAsset.erc721, sellAccount)
    const bal = await userAccount.getERC721Balances(bscTestMockAsset.erc721, tokenId.toString(), sellAccount)
    console.log('Erc721 allow', allow, bal)
    if (!allow || bal === '0') {
      console.log('fillOrder Erc721 bal = 0   fail ')
      return
    }

    // const approve20Tx =await userAccount.approveErc20Proxy(bscTestMockAsset.erc20)
    // await approve20Tx.wait()

    const allowBal = await userAccount.getERC20Allowance(bscTestMockAsset.erc20, buyAccount)
    const erc20bal = await userAccount.getERC20Balances(bscTestMockAsset.erc20, buyAccount)
    console.log('Erc20 allow', allowBal, 'bal', erc20bal)

    const tx = await buyContract.fillOrder(signedOrder)
    await tx.wait()
    console.log('fillOrder ok', tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
