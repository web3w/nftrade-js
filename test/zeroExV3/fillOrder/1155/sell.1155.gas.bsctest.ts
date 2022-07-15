import { BigNumber } from '@txdev/0x-utils'
import { ethers } from 'ethers'
import secrets from '../../../../../secrets.json'
import { ZeroExchange } from '../../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../../src/order-utils'
import { Account } from '../../../../src/account'
import { DealOrder } from '@txdev/0x-utils/lib'
import { BuyOrderParams } from '../../../../src/api'


const NULL_ADDRESS = ethers.constants.AddressZero
const sellAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyAccount = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const tokenId = new BigNumber('2')
const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn50 = new BigNumber('500')

const bn200 = new BigNumber('200')


const bscTestMockAsset = {
    'bnb': '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    'erc20': '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    'erc721': '0x066561b3369fa33E56D58C3fcE621FF82B4Cdd3F',
    'erc1155': '0x8Dd87EA5724562027751527df4De4E0CC3d052b0'
  }


;(async () => {
  try {
    const chainId = 97

    // 买家创建订单
    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })

    const collection = {
      royaltyFeePoints: 200,
      royaltyFeeAddress: '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
    }
    const tokenId = '2'
    const buyAsset = {
      tokenId,
      tokenAddress: bscTestMockAsset.erc1155,
      schemaName: 'ERC1155',
      collection
    }


    const quantity = 3, startAmount = 0.0001
    const buyParams = {
      asset: buyAsset,
      quantity,
      startAmount
    } as BuyOrderParams
    const signedOrder = await buyContract.createBuyOrder(buyParams)
    const txAmount = new BigNumber(quantity).times(startAmount).times(new BigNumber(10).pow(18))

    // 卖家登录 出售
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })
    const sellerBeforBal = await sellContract.getAccountBalance({ tokenAddr: bscTestMockAsset.bnb })
    const sellerBeforAsset = await sellContract.getERC1155Balances(bscTestMockAsset.erc1155, tokenId)

    const dealOrder = orderHashUtils.converStrOrder(signedOrder)
    const tx = await sellContract.orderMatch(<DealOrder>dealOrder)
    await tx.wait()
    console.log('orderMatch ok', tx.hash)

    const sellerAfterBal = await sellContract.getAccountBalance({ tokenAddr: bscTestMockAsset.bnb })
    const sellerAfterAsset = await sellContract.getERC1155Balances(bscTestMockAsset.erc1155, tokenId)

    console.assert(new BigNumber(sellerBeforBal.erc20Bal).plus(txAmount).minus(signedOrder.makerFee).eq(sellerAfterBal.erc20Bal),
      `${sellerBeforBal.erc20Bal} -- ${sellerAfterBal.erc20Bal} --${txAmount}`)

    console.assert(new BigNumber(sellerBeforAsset).minus(quantity).eq(sellerAfterAsset),
      `${sellerBeforAsset} -- ${sellerAfterAsset}`)
    //
    //
    // console.log('fillOrder ok', tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
