import { BigNumber } from '@txdev/0x-utils'
import { ethers } from 'ethers'
import secrets from '../../../../../secrets.json'
import { ZeroExchange } from '../../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../../src/order-utils'
import { Account } from '../../../../src/account'
import { BuyOrderParams, SellOrderParams } from '../../../../src/api'
import { DealOrder } from '@txdev/0x-utils/lib'


const NULL_ADDRESS = ethers.constants.AddressZero
const sellAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const buyAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'



const bscTestMockAsset = {
    'erc20': '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    'erc721': '0x066561b3369fa33E56D58C3fcE621FF82B4Cdd3F',
    'erc1155': '0x8Dd87EA5724562027751527df4De4E0CC3d052b0'
  }


;(async () => {
  try {
    const chainId = 97
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })

    const collection = {
      royaltyFeePoints: 200,
      royaltyFeeAddress: '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
    }
    const tokenId = '2'
    const sellAsset = {
      tokenId,
      tokenAddress: bscTestMockAsset.erc1155,
      schemaName: 'ERC1155',
      collection
    }

    // const paymentToken = {
    //   name: 'BUST',
    //   address: bscTestMockAsset.erc20,
    //   symbol: 'BUST',
    //   decimals: 18
    // }

    const quantity = 2, partAmount = 0.0001
    const sellParams = {
      asset: sellAsset,
      quantity,
      startAmount:partAmount*quantity
    } as SellOrderParams

    const signedOrder = await sellContract.createSellOrder(sellParams)

    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })

    const buyerBeforBal = await buyContract.getAccountBalance({})
    const buyerBeforAsset = await buyContract.getERC1155Balances(bscTestMockAsset.erc1155,tokenId)

    const dealOrder = orderHashUtils.converStrOrder(signedOrder)

    const buyQty = new BigNumber(1)
    const tx = await buyContract.orderMatch(<DealOrder>dealOrder,buyQty)


    const receipt = await tx.wait()
    console.log("gasUsed",receipt.gasUsed.toString(), "cumulativeGasUsed",receipt.cumulativeGasUsed.toString())
    let gasPrice = tx.gasPrice ? tx.gasPrice.toString() : '0'
    if (gasPrice == '0') {
      if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
        gasPrice = tx.maxFeePerGas.add(tx.maxPriorityFeePerGas).toString()
      }
      if (gasPrice == '0') {
        throw 'tx error'
      }
    }

    const gasFee = new BigNumber(gasPrice).times(receipt.gasUsed.toString())

    const buyerAfterBal = await buyContract.getAccountBalance({})
    const buyerAfterAsset = await buyContract.getERC1155Balances(bscTestMockAsset.erc1155,tokenId)

    const txAmount = new BigNumber(buyQty).times(partAmount).times(new BigNumber(10).pow(18))


    const spend = new BigNumber(buyerBeforBal.ethBal).minus(buyerAfterBal.ethBal).minus(gasFee);
    console.assert((txAmount).eq(spend),`${spend} --${txAmount}`)

    console.assert(new BigNumber(buyerBeforAsset).plus(buyQty).eq(buyerAfterAsset),
      `${buyerBeforAsset} -- ${buyerAfterAsset}`)

    console.log('buy fillOrder ok', tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
