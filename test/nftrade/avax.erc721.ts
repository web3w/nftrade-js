import secrets from '../../../secrets.json'
import { Asset, SellOrderParams } from 'web3-accounts'
import { NFTradeEx } from '../../src/nftradeEx'
import { DealOrder } from '@txdev/0x-utils/lib'

const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const seller = '0x6E339d654815c6d79727f1b94b77d85863eB3659'


const chainId = 43114
const sellContract = new NFTradeEx({
  chainId,
  address: seller,
  privateKeys: secrets.privateKeys
})

const buyContract = new NFTradeEx({
    chainId,
    address: buyer,
    privateKeys: secrets.privateKeys
  })


;(async () => {
  try {

    const collection = {
      royaltyFeePoints: 200,
      royaltyFeeAddress: '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
    }
    const sellAsset = {
      tokenId: '5',
      tokenAddress: '0x90259d1416e5aea964eac2441aa20e9fb2d99262',
      schemaName: 'ERC721',
      collection
    } as Asset

    const sellAsset1155 = {
      tokenId: '5',
      tokenAddress: '0xdad95F1Ec9360Ffd5c942592b9A5988172134a35',
      schemaName: 'ERC1155',
      collection
    } as Asset


    const quantity = 1, startAmount = 0.0002
    const sellParams = {
      asset: sellAsset,
      quantity,
      startAmount
    } as SellOrderParams

    const sellParams1155 = {
      asset: sellAsset1155,
      quantity: 2,
      startAmount
    } as SellOrderParams

    let sellbal = await sellContract.userAccount.getAssetBalances(sellAsset)
    let buybal = await buyContract.userAccount.getAssetBalances(sellAsset)

    if (sellbal == '0' && buybal == '0') {
      throw new Error(' sellbal and buybal 0')
    }
    if (sellbal == '1') {
      const signedOrder = await sellContract.createSellOrder(sellParams)
      
      const calldata = await sellContract.orderMatchCallData([signedOrder])
      const gas = await sellContract.estimateGas(calldata)
      console.log(gas)
      return
      const tx = await buyContract.orderMatch([signedOrder])
      await tx.wait()
      console.log('BuyNow:', tx.hash)
      buybal = await buyContract.userAccount.getAssetBalances(sellAsset)
    }

    if (buybal == '1') {
      const signedOrder = await sellContract.createBuyOrder(sellParams)
      const tx = await buyContract.orderMatch([signedOrder])
      await tx.wait()
      sellbal = await sellContract.userAccount.getAssetBalances(sellAsset)
      console.log('Accept:', tx.hash, sellbal)

    }

  } catch (e) {
    console.log(e)
  }
})()
