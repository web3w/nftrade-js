import * as secrets from '../../../secrets.json'
import { SwapEx, TradeDetails } from '../../src/swapEx/swapEx'
import { ZeroExV3 } from '../../src/zeroExV3'
import { SellOrderParams, TokenSchemaName } from 'web3-accounts'

const buyer = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const seller = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

;(async () => {
    const chainId = 4
    const sellEx = new ZeroExV3({
      chainId,
      address: seller,
      privateKeys: secrets.privateKeys
    })

    const buyerEx = new ZeroExV3({
      chainId,
      address: buyer,
      privateKeys: secrets.privateKeys
    })

    const swapEx = new SwapEx({
      chainId,
      address: buyer,
      privateKeys: secrets.privateKeys
    })

    try {


      const sellAssets = [
        {
          tokenId: '11',
          tokenAddress: '0x848c49d17a138cb148cdde57bdac50a88b0cb561',
          schemaName: 'ERC1155'
        },
        {
          tokenId: '5',
          tokenAddress: '0xb13cadf99724fdf7a79ca883e3063417eb00d01a',
          schemaName: 'ERC721'
        },
        ]


      let tradeDatas: TradeDetails[] = []
      let orders: string[] = []
      for (const asset of sellAssets) {
        const quantity = asset.schemaName == TokenSchemaName.ERC721 ? 1 : 2
        const sellParams = {
          asset: asset,
          startAmount: 0.0002,
          quantity
        } as SellOrderParams
        const sellData = await sellEx.createSellOrder(sellParams)
        orders.push(JSON.stringify(sellData))
        const { data, value } = await buyerEx.orderMatchCallData([sellData], '1')
        tradeDatas.push({ marketId: '4', value:value?.toString()||"1", tradeData: data })
      }


      // console.log('\n--------------------Zero Ex Swap V2 Market------------------\n')


      // const ll = await swapEx.swapExContract.markets(4)
      // const gas = await swapEx.batchBuyWithETHSimulate(tradeDatas)
      // console.log(gas)
      const gas = await swapEx.batchBuyWithETH(tradeDatas)
      // const gas = await swapEx.buyZeroV3WithETH(orders)
      await gas.wait()
      console.log('batchBuyWithETH gas', gas.hash)


    } catch (e) {
      console.log(e)
    }
  }
)()
