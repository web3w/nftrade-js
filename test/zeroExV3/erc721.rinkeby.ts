import secrets from '../../../secrets.json'
import { Asset, SellOrderParams } from 'web3-accounts'
import { ZeroExV3Sdk } from '../../src/zeroExV3Agent'

const sellAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'

const chainId = 4
const sellerEx = new ZeroExV3Sdk({
  chainId,
  address: sellAccount,
  privateKeys: secrets.privateKeys
})
const buyerEx = new ZeroExV3Sdk({
    chainId,
    address: buyAccount,
    privateKeys: secrets.privateKeys
  })
;(async () => {
  try {
    const seller = sellerEx.userAccount
    const buyer = buyerEx.userAccount

    const tokenId = '5'
    const collection = {
      royaltyFeePoints: 200,
      royaltyFeeAddress: '0x2d0c5c5a495134e53ea65c94c4e07f45731f7201'
    }
    const sellAsset = {
      tokenId,
      tokenAddress: '0xb13cadf99724fdf7a79ca883e3063417eb00d01a',
      schemaName: 'ERC721'
    } as Asset
    const quantity = 1, startAmount = 0.001
    const sellParams = {
      asset: sellAsset,
      quantity,
      startAmount
    } as SellOrderParams

    let sellbal = await seller.getAssetBalances(sellAsset)
    let buybal = await buyer.getAssetBalances(sellAsset)
    if (sellbal == '0' && buybal == '0') {
      throw new Error(' sellbal and buybal 0')
    }

    if (sellbal == '1') {
      const signedOrder = await sellerEx.createSellOrder(sellParams)
      console.log(JSON.stringify(signedOrder, null, 2))
      // return
      const tx = await buyerEx.fulfillOrder(JSON.stringify(signedOrder))
      await tx.wait()
      console.log('BuyNow:', tx.hash)
      buybal = await buyer.getAssetBalances(sellAsset)
    }

    if (buybal == '1') {
      const signedOrder = await sellerEx.createBuyOrder(sellParams)
      const tx = await buyerEx.fulfillOrder(JSON.stringify(signedOrder))
      await tx.wait()
      sellbal = await seller.getAssetBalances(sellAsset)
      console.log('Accept:', tx.hash, sellbal)

    }


    // const sellOrder = await sellerEx.createSellOrder(sellParams)
    //
    // console.log(sellOrder)

    // console.log(sellContract.walletInfo.rpcUrl)
    // await sellContract.setBestRPC()
    // console.log(sellContract.walletInfo.rpcUrl)

    // const beforeIsCanceled1 = await sellContract.exchange.cancelled('0x8c96d2eb5e68c27e6dd13f4c11b656105b596b6035ea1d7c04a4cea6f7e3c7b5')
    //
    // console.log(beforeIsCanceled1)
  } catch (e) {

    console.log(e)
  }
})()
