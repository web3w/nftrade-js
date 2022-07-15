import secrets from '../../../secrets.json'
import {ZeroExV3} from '../../src/zeroExV3'
import {Asset, SellOrderParams} from 'web3-accounts'

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
            schemaName: 'ERC1155',
        } as Asset

        const sell721Asset = {
            tokenId: '305243',
            tokenAddress: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53',
            schemaName: 'ERC721',
            collection
        } as Asset

        const quantity = 1, startAmount = 0.0002
        const sellParams = {
            asset: sellAsset,
            quantity,
            startAmount
        } as SellOrderParams

        const sell721Params = {
            asset: sell721Asset,
            quantity,
            startAmount
        } as SellOrderParams

        let sellbal = await seller.getAssetBalances(sell721Asset)
        let buybal = await buyer.getAssetBalances(sell721Asset)
        if (sellbal == '0' && buybal == '0') {
            throw new Error(' sellbal and buybal 0')
        }
        if (buybal == '1') {
            const tx = await buyer.transfer(sell721Asset, sellAccount, 1)
            await tx.wait()
            sellbal = "1"
            buybal = "0"
        }

        if (Number(sellbal) > Number(buybal)) {
            buybal = await buyer.getAssetBalances(sellAsset)
            let buybal721 = await buyer.getAssetBalances(sell721Asset)
            console.log('BuyNow:', buybal, buybal721)
            sellParams.quantity = Number(10)
            const signedOrder = await sellerEx.createSellOrder(sellParams)
            const signe721dOrder = await sellerEx.createSellOrder(sell721Params)
            const tx = await buyerEx.orderMatch([signedOrder, signe721dOrder], '10')
            await tx.wait()
            buybal = await buyer.getAssetBalances(sellAsset)
            buybal721 = await buyer.getAssetBalances(sell721Asset)
            console.log('BuyNow:', tx.hash, buybal, buybal721)
        } else {
            const signedOrder = await sellerEx.createBuyOrder(sellParams)
            const tx = await buyerEx.orderMatch([signedOrder])
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
