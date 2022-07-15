import { ethers } from 'ethers'
import secrets from '../../../../secrets.json'
import { BigNumber } from '@txdev/0x-utils'

import { ZeroExchange } from '../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../src/order-utils'
import { Account } from '../../../src/account'
import { DealOrder } from '@txdev/0x-utils/lib'


const NULL_ADDRESS = ethers.constants.AddressZero
const sellAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const tokenId = new BigNumber('5')
const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn50 = new BigNumber('50')
const bn200 = new BigNumber('200')

const bscTestMockAsset = {
    'bnb': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    'erc201': '0x26aFE7885cdCFF35ADE8498Bd183577dC98E3fcc',
    'erc721': '0x066561b3369fa33E56D58C3fcE621FF82B4Cdd3F',
    'erc1155': '0x2a3eCaeA2A31bb34e84835Bd6799614304AaFa5F'
  }


;(async () => {
  try {
    // const wallet = new ethers.Wallet(secrets.accounts[buyAccount], provider)
    const erc721AssetData = assetDataUtils.encodeERC721AssetData(bscTestMockAsset.erc721, tokenId)
    const erc20AssetData = assetDataUtils.encodeERC20AssetData(bscTestMockAsset.bnb)


    const chainId = 97
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })


    // const order = {
    //   makerAddress: sellAccount,
    //   takerAddress: NULL_ADDRESS,
    //   feeRecipientAddress: NULL_ADDRESS,
    //   senderAddress: NULL_ADDRESS,
    //   makerAssetAmount: bn1,
    //   takerAssetAmount: bn200,
    //   makerFee: bn0,
    //   takerFee: bn50,
    //   expirationTimeSeconds: new BigNumber('16499305000820'),
    //   salt: bn1,
    //   takerAssetData: erc20AssetData,
    //   makerAssetData: erc721AssetData,
    //   makerFeeAssetData: '0x',
    //   takerFeeAssetData: '0x'
    // }

    const feeAddr = '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
    const order_fee = {
      makerAddress: sellAccount,
      takerAddress: NULL_ADDRESS,
      feeRecipientAddress: feeAddr,
      senderAddress: NULL_ADDRESS,
      makerAssetAmount: bn1,
      takerAssetAmount: bn200,
      makerFee: bn0,
      takerFee: bn200,
      expirationTimeSeconds: new BigNumber('16499305000820'),
      salt: bn1,
      takerAssetData: erc20AssetData,
      makerAssetData: erc721AssetData,
      makerFeeAssetData: '0x',
      takerFeeAssetData: erc20AssetData
    }

    const signedOrder = await sellContract.orderSign(order_fee)

    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })


    const userAccount = new Account({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })

    const allow = await userAccount.getERC721Allowance(bscTestMockAsset.erc721, sellAccount)
    const bal = await userAccount.getERC721Balances(bscTestMockAsset.erc721, tokenId.toString(), sellAccount)
    console.log('Erc721 allow', allow, bal)


    if (bal === '0') {
      const owner = await userAccount.getERC721OwnerOf(bscTestMockAsset.erc721, tokenId.toString())
      console.log('ERC721 owner', owner)
      console.log('marketBuyOrdersWithEth Erc721 bal = 0   fail')
      return
    }

    const dealOrder = orderHashUtils.converStrOrder(signedOrder)
    const tx = await buyContract.orderMatch(<DealOrder>dealOrder)
    await tx.wait()
    console.log('marketBuyOrdersWithEth ok', tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
