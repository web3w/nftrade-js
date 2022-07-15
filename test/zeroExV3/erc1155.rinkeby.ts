import secrets from '../../../secrets.json'
import {ZeroExV3} from '../../src/zeroExV3'
import {Asset, SellOrderParams} from 'web3-accounts'
import {ZeroExV3Sdk} from '../../src/zeroExV3Agent'

const sellAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'


const chainId = 4
const sellerEx = new ZeroExV3({
    chainId,
    address: sellAccount,
    privateKeys: secrets.privateKeys
})
const buyerEx = new ZeroExV3({
        chainId,
        address: buyAccount,
        privateKeys: secrets.privateKeys
    })
;(async () => {
    try {
        const seller = sellerEx.userAccount
        const buyer = buyerEx.userAccount

        const tokenId = '13'
        const collection = {
            royaltyFeePoints: 200,
            royaltyFeeAddress: '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
        }
        const sellAsset = {
            tokenId,
            tokenAddress: '0x991a868aa7b0a9a24565ede2d8fe758874a6a217',
            schemaName: 'ERC1155'
        } as Asset

        const quantity = 2, startAmount = 0.0002
        const sellParams = {
            asset: sellAsset,
            quantity,
            startAmount
        } as SellOrderParams


        let sellbal = await seller.getAssetBalances(sellAsset)
        let buybal = await buyer.getAssetBalances(sellAsset)
        console.log('Seller:', sellbal, 'Buyer:', buybal)
        if (sellbal == '0' && buybal == '0') {
            throw new Error(' sellbal and buybal 0')
        }
        if (Number(buybal) > Number(sellbal)) {
            const tx = await buyer.transfer(sellAsset, sellAccount, 2)
            await tx.wait()
        }

        // buybal = await buyer.getAssetBalances(sellAsset)
        // sellParams.quantity = Number(10)

        const signedOrder1 = await sellerEx.createSellOrder(sellParams)
        const tx1 = await buyerEx.orderMatch([signedOrder1])
        await tx1.wait()
        buybal = await buyer.getAssetBalances(sellAsset)
        console.log('Buyer BuyNow:', tx1.hash, buybal)

        const signedOrder = await sellerEx.createBuyOrder(sellParams)
        const tx = await buyerEx.orderMatch([signedOrder])
        await tx.wait()
        sellbal = await seller.getAssetBalances(sellAsset)
        console.log('Seller Accept:', tx.hash, sellbal)
    } catch (e) {

        console.log(e)
    }
})()
