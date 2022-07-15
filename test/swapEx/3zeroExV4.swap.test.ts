import * as secrets from '../../../secrets.json'
import { SwapEx } from '../../src/swapEx/swapEx'
import { SellOrderParams } from 'web3-accounts'
import { ZeroExV4Agent } from '../../src/zeroExV4Agent'

// const rpcUrl = 'https://api-test.element.market/api/v1/jsonrpc'
const seller = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyer = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

;(async () => {
    const sellEx = new ZeroExV4Agent({
      chainId: 4,
      address: seller,
      priKey: secrets.accounts[seller]
    })

    const swapEx = new SwapEx({
      chainId: 4,
      address: buyer,
      priKey: secrets.accounts[buyer]
    })


    try {
      const sellAsset = {
        tokenId: '8001',
        tokenAddress: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53',
        schemaName: 'ERC721'
      }
      // paymentToken: sellEx.contracts.ETH,
      const sellParams = {
        asset: sellAsset,
        startAmount: 0.0001
      } as SellOrderParams

      // console.log(sellParams)
      const sellData = await sellEx.createSellOrder(sellParams)
      // console.log(sellData)

      const orderStr = JSON.stringify(sellData)

      const matchData = await sellEx.getMatchCallData({ orderStr })
      const swaps = [
        {
          'marketId': 3,
          'value': matchData.callData.value,
          'tradeData': matchData.callData.data
        }
      ]

      console.log('\n--------------------Zero Ex V4 Market------------------\n')

      // const gas = await eleSwapEx.batchBuyWithETHGas(3, matchData.callData.value, matchData.callData.data)
      const gas = await swapEx.swapExContract.estimateGas.batchBuyWithETH(swaps, { value: matchData.callData.value })

      console.log('batchBuyWithETH gas', gas.toString())


    } catch (e) {
      console.log(e)
    }
  }
)()
