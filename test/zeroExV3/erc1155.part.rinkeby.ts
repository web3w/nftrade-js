import secrets from '../../../secrets.json'
import { Asset, SellOrderParams } from 'web3-accounts'
import { ZeroExV3Agent } from '../../index'


const seller = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

const chainId = 4
const sellContract = new ZeroExV3Agent({
  chainId,
  address: seller,
  privateKeys: secrets.privateKeys
})

const buyContract = new ZeroExV3Agent({
  chainId,
  address: buyer,
  privateKeys: secrets.privateKeys
})

const paymentToken = {
    name: 'TST',
    address: '0xb506bfaa7661dabf4de80672bd3f13f4610a5fdf',
    symbol: 'TST',
    decimals: 18
  }
;(async () => {
  try {
    const collection = {
      royaltyFeePoints: 200,
      royaltyFeeAddress: '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
    }
    const tokenId = '13'
    const sellAsset = {
      tokenId,
      tokenAddress: '0x991a868aa7b0a9a24565ede2d8fe758874a6a217',
      schemaName: 'ERC1155',
      collection
    } as Asset

    const quantity = 2, startAmount = 0.00002
    const sellParams = {
      asset: sellAsset,
      quantity,
      startAmount
    } as SellOrderParams

    let sellbal = await sellContract.userAccount.getAssetBalances(sellAsset)
    let buybal = await buyContract.userAccount.getAssetBalances(sellAsset)

    console.log('Seller:', sellbal, 'Buyer:', buybal)
    if (sellbal == '0' && buybal == '0') {
      throw new Error(' sellbal and buybal 0')
    }
    if (Number(sellbal) > Number(buybal)) {
      sellParams.quantity = Number(sellbal)
      sellParams.paymentToken = paymentToken
      const signedOrder = await sellContract.createSellOrder(sellParams)
      //{ takerAmount: '10' }
      console.log(signedOrder)
      const tx = await buyContract.matchOrder(JSON.stringify(signedOrder))
      await tx.wait()
      buybal = await buyContract.userAccount.getAssetBalances(sellAsset)
      console.log('Buyer BuyNow:', tx.hash, buybal)
    } else {
      sellParams.quantity = 100
      sellParams.paymentToken = paymentToken
      const signedOrder = await sellContract.createBuyOrder(sellParams)
      console.log(signedOrder)
      const tx = await buyContract.matchOrder(JSON.stringify(signedOrder))
      await tx.wait()
      sellbal = await sellContract.userAccount.getAssetBalances(sellAsset)
      console.log('Seller Accept:', tx.hash, sellbal)
    }

  } catch (e) {
    console.log(e)
  }
})()
