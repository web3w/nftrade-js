import * as secrets from '../../../secrets.json'
import { SwapEx } from '../../src/swapEx/swapEx'
import { TokenSchemaName, SellOrderParams } from 'web3-accounts'
import { NFTradeExAgent } from '../../src/nftradeExAgent'

const seller = '0x36b1a29e0bbd47dfe9dcf7380f276e86da90c4c2'
const buyer = '0x6E339d654815c6d79727f1b94b77d85863eB3659'

;(async () => {
    const chainId = 43114
    const sellEx = new NFTradeExAgent({
      chainId,
      address: seller,
      privateKeys: secrets.privateKeys
    })

    const swapEx = new SwapEx({
      chainId,
      address: buyer,
      privateKeys: secrets.privateKeys
    })


    try {
      const sellAssets = [{
        tokenId: '2',
        tokenAddress: '0x90259d1416e5aea964eac2441aa20e9fb2d99262',
        schemaName: 'ERC721'
      }, {
        tokenId: '1',
        tokenAddress: '0xdad95f1ec9360ffd5c942592b9a5988172134a35',
        schemaName: 'ERC1155'
      }]
      let orders: string[] = []
      for (const asset of sellAssets) {
        const quantity = asset.schemaName.toLowerCase() == 'erc721' ? 1 : 2
        const sellParams = {
          asset: asset,
          startAmount: 0.0001,
          quantity
        } as SellOrderParams
        const sellData = await sellEx.createSellOrder(sellParams)
        orders.push(JSON.stringify(sellData))
      }
      console.log('\n--------------------Zero Ex V2 Market------------------\n')

      const gas = await swapEx.buyNFTradeWithETH(orders)
      console.log(gas)

      // console.log('batchBuyWithETH gas', gas.toString())


    } catch (e) {
      console.log(e)
    }
  }
)()
