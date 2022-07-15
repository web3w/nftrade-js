import * as secrets from '../../../secrets.json'
import { SwapEx } from '../../src/swapEx/swapEx'
import { TokenSchemaName,  SellOrderParams } from 'web3-accounts'
import {getChainRpcUrl,} from "web3-wallets"
import { ZeroExV3Sdk } from '../../src/zeroExV3Agent'
import { ZeroExV3 } from '../../src/zeroExV3'
import { DealOrder } from '@txdev/0x-utils'

const seller = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

;(async () => {
    const chainId = 97
    const rpcUrl = 'https://api-test.element.market/api/bsc/jsonrpc'// await getChainRpcUrl(chainId)
    const sellEx = new ZeroExV3({
      chainId,
      address: seller,
      priKey: secrets.accounts[seller],
      rpcUrl
    })

    const swapEx = new SwapEx({
      chainId,
      address: buyer,
      priKey: secrets.accounts[buyer],
      rpcUrl
    })

    try {
      // , {
      //     tokenId: '1',
      //       tokenAddress: '0x8dd87ea5724562027751527df4de4e0cc3d052b0',
      //       schemaName: 'ERC1155'
      //   }
      const sellAssets = [{
        tokenId: '24',
        tokenAddress: '0xcf09aba56f36a4521094c3bf6a303262636b2e1a',
        schemaName: 'ERC721'
      }]
      let orders: string[] = []
      let dealOrder: DealOrder[] = []
      for (const asset of sellAssets) {
        const quantity = asset.schemaName == TokenSchemaName.ERC721 ? 1 : 2
        const sellParams = {
          asset: asset,
          startAmount: 0.0001,
          quantity
        } as SellOrderParams
        const sellData = await sellEx.createSellOrder(sellParams)
        dealOrder.push(sellData)
        orders.push(JSON.stringify(sellData))
      }
      const tt = await sellEx.orderMatch(dealOrder, '1')
      console.log(tt.hash)


      console.log('\n--------------------Zero Ex V2 Market------------------\n')

      // const gas = await eleSwapEx.batchBuyWithETHGas(3, matchData.callData.value, matchData.callData.data)
      // const gas = await swapEx.buyZeroV3WithETH(orders)

      // console.log('batchBuyWithETH gas', gas.toString())


    } catch (e) {
      console.log(e)
    }
  }
)()
