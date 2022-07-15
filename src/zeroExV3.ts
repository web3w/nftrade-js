import { ZeroExContract } from './contracts'
import {
  DealOrder, APIConfig,
  BigNumber,
  LimitedCallSpec,
  OrderSide,
  transactionToCallData,
  WalletInfo,
  Asset
} from './types'
import { orderFactory } from './utils/order_factory'

export class ZeroExV3 extends ZeroExContract {

  constructor(wallet: WalletInfo, config?: APIConfig) {
    super(wallet, config)
    this.eip712DomainName = '0x Protocol'
    this.eip712DomainVersion = '3.0.0'
    this.protocolFeePoints = 0
  }

  // ------------------ Zero Ex  --------------------------
  public async orderMatch(
    orders: DealOrder[],
    nftAmount?: string
  ) {
    const calldata = await this.orderMatchCallData(orders, nftAmount)
    await this.estimateGas(calldata).catch(e => {
      throw new Error(e)
    })
    return this.ethSend(calldata)
  }

  //Zero Ex Exchange
  public async orderMatchCallData(
    orders: DealOrder[],
    takerAmount?: string
  ): Promise<LimitedCallSpec> {
    // const order = orders[0]
    const takerAmounts = takerAmount ? new Array(orders.length).fill(takerAmount) : undefined
    const {
      orderAll,
      makerAssetBuyAmount,
      orderAmounts,
      signatures,
      value
    } = await this.batchOrder(orders, takerAmounts)
    const order = orderAll[0]

    await this.checkMatchOrder(order, makerAssetBuyAmount)
    const takerData: Asset = orderFactory.getAsset(order.takerAssetData)
    // const takerAmount = makerAssetBuyAmount
    let callData
    // const nftAmount = takerAmount
    if (takerData.tokenAddress.toLowerCase() == this.GasWarpperToken.address.toLowerCase()) {
      const ethFeeAmounts = [] //data.takerFee
      const feeRecipients = [] //data.feeRecipientAddress
      const params = [orders, makerAssetBuyAmount, signatures, ethFeeAmounts, feeRecipients]
      // console.log('marketBuyOrdersWithEth', params)
      // // Zero Ex Froward
      callData = await this.forwarderEx.populateTransaction.marketBuyOrdersWithEth(...params, { value })
    } else {
      let takerAmount = order.takerAssetAmount
      // const takerData = orderFactory.getAssetData(order.takerAssetData, order.takerAssetAmount)
      if (takerData.schemaName == 'ERC20') {
        // takerAmount = order.takerFee.plus(takerAmount)
        takerAmount = new BigNumber(takerAmount).div(order.makerAssetAmount).times(makerAssetBuyAmount).toString()
      } else {
        takerAmount = makerAssetBuyAmount
      }
      const signature = order.signature
      console.log('Fill Order takerAssetFillAmount', takerAmount)
      callData = await this.exchange.populateTransaction.fillOrder(order, takerAmount, signature)
    }
    return transactionToCallData(callData)
  }

}

