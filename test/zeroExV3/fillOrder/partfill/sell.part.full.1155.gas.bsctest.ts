import { BigNumber } from '@txdev/0x-utils'
import { ethers } from 'ethers'
import secrets from '../../../../../secrets.json'
import { ZeroExchange } from '../../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils, constants } from '../../../../src/order-utils'
import { Account } from '../../../../src/account'
import { DealOrder } from '@txdev/0x-utils/lib'
import { BuyOrderParams } from '../../../../src/api'


const buyAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const sellAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'


const bscTestMockAsset = {
    'bnb': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    'erc20': '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    'erc721': '0x066561b3369fa33E56D58C3fcE621FF82B4Cdd3F',
    'erc1155': '0x8Dd87EA5724562027751527df4De4E0CC3d052b0'
  }


;(async () => {
  try {
    const chainId = 97
    const feeAddr = constants.FEE_RECIPIENT_ADDRESS

    // 买家创建订单
    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })

    const royaltyFee = 250

    const collection = {
      royaltyFeePoints: royaltyFee,
      royaltyFeeAddress: feeAddr
    }
    const tokenId = '2'
    const buyAsset = {
      tokenId,
      tokenAddress: bscTestMockAsset.erc1155,
      schemaName: 'ERC1155',
      collection
    }

    const paymentToken = {
      name: 'TST',
      address: bscTestMockAsset.erc20,
      symbol: 'TST',
      decimals: 18
    }

    const quantity = 5, partAmount = 0.0001
    const buyParams = {
      asset: buyAsset,
      quantity,
      startAmount: partAmount * 5,
      paymentToken
    } as BuyOrderParams
    const signedOrder = await buyContract.createBuyOrder(buyParams)
    console.log('markfee', signedOrder.makerFee.toString())

    // 卖家登录 出售
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })

    const feeBeforBal = await sellContract.getERC20Balances(paymentToken.address, feeAddr)

    const sellerBeforBal = await sellContract.getAccountBalance({ tokenAddr: paymentToken.address })
    const sellerBeforAsset = await sellContract.getERC1155Balances(bscTestMockAsset.erc1155, tokenId)

    const dealOrder = orderHashUtils.converStrOrder(signedOrder)
    const sellQty = new BigNumber(2)
    const payAmount = new BigNumber(sellQty).times(partAmount).times(new BigNumber(10).pow(18))


    const tx = await sellContract.orderMatch(<DealOrder>dealOrder, sellQty)
    await tx.wait()

    const feeAfterBal = await sellContract.getERC20Balances(paymentToken.address, feeAddr)
    const sellerAfterBal = await sellContract.getAccountBalance({ tokenAddr: paymentToken.address })
    const sellerAfterAsset = await sellContract.getERC1155Balances(bscTestMockAsset.erc1155, tokenId)

    const fee = payAmount.times(royaltyFee + 250).div(10000)


    console.assert(new BigNumber(feeAfterBal).minus(feeBeforBal).eq(fee), `${fee} -- ${feeAfterBal}-${feeBeforBal} `)

    // const income = txAmount.minus(signedOrder.makerFee)
    const income = payAmount.minus(fee)
    const erc20Diff = new BigNumber(sellerAfterBal.erc20Bal).minus(sellerBeforBal.erc20Bal)
    console.assert(income.eq(erc20Diff), `${income} -- ${erc20Diff} --minus:${income.minus(erc20Diff)}`)

    console.assert(new BigNumber(sellerBeforAsset).minus(sellQty).eq(sellerAfterAsset),
      `${sellerBeforAsset} -- ${sellerAfterAsset}`)


    console.log('fillOrder ok', tx.hash)

    const tx1 = await sellContract.orderMatch(<DealOrder>dealOrder, sellQty)
    await tx1.wait()
    console.log('fillOrder1 ok', tx1.hash)
  } catch (e) {
    console.log(e)
  }
})()
