import { ZeroExchange } from '../../src/zeroExV3'
import { assetDataUtils, computerExpirationAndSalt, orderHashUtils } from '../../src/order-utils'
import { DealOrder } from '@txdev/0x-utils/lib'
import { BigNumber } from '../../index'
import secrets from '../../../secrets.json'

const chainId = 56
const NULL_ADDRESS ="0x0000000000000000000000000000000000000000"
const config = {
  chainId,
  'contractAddresses': {
    'ElementEx': '0x0f63A418E37988b1D9B427756d250Ebe9c312f75',
    'Exchange': '0xcfb6ee27d82beb1b0f3ad501b968f01cd7cc5961',
    'ERC20Proxy': '0xE05D2BAA855C3dBA7b4762D2f02E9012Fb5F3867',
    'ERC721Proxy': '0x2559Be60A7040D645D263cA54c936320f90be74b',
    'ERC1155Proxy': '0x295f911ccb8C771593375a4e8969A124bad725d8',
    'ForwarderEx': '0xc28f1550160478a7fb3b085f25d4b179e08e649a',
    'FeeDispatcher': '0x0000000000000000000000000000000000000000',
    'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
    'GasToken': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
  }
}

const rpcUrl = 'https://bsc-dataseed1.defibit.io/'
const sellAccount = '0x548427d1418066763173dd053D9d1AE32D161310'
const sellContract = new ZeroExchange({
  chainId,
  address: sellAccount,
  rpcUrl,
  priKey: secrets.accounts[sellAccount]
}, config)

const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn2 = new BigNumber('2')
const bn200 = new BigNumber('20')

;(async () => {
  try {
    const tokenId = "8"
    const tokenAddr ="0xb9c386b935d4ca3ed0acd8f1c7500026a0ab030d"
    const partAmount = bn200
    const erc721AssetData = assetDataUtils.encodeERC721AssetData(tokenAddr, new BigNumber(tokenId))
    const erc20AssetData = assetDataUtils.encodeERC20AssetData('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c')

    const order = {
      makerAddress: sellAccount,
      takerAddress: NULL_ADDRESS,
      feeRecipientAddress: NULL_ADDRESS,
      senderAddress: NULL_ADDRESS,
      makerAssetAmount: bn1,
      takerAssetAmount: partAmount,
      makerFee: bn0,
      takerFee: bn0,
      expirationTimeSeconds: new BigNumber('1642295961672000'),
      salt: new BigNumber(new Date().getTime()),
      takerAssetData: erc20AssetData,
      makerAssetData: erc721AssetData,
      makerFeeAssetData: '0x',
      takerFeeAssetData: '0x'
    }

    const sellerBeforAsset = await sellContract.getERC721Balances(tokenAddr, tokenId)
    console.assert(sellerBeforAsset == "1","sellerBeforAsset error")

    const signedOrder = await sellContract.order712Sign(order)




    const dealOrder = orderHashUtils.converStrOrder(signedOrder) as DealOrder


    console.log(dealOrder)


  } catch (e) {
    console.log(e)
  }
})()
