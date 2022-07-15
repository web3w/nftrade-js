import {
  APIConfig, Asset, BigNumber, DealOrder, LimitedCallSpec, transactionToCallData,
  WalletInfo
} from './types'
import { NFTREADE_CONTRACTS_ADDRESSES } from './contracts/config'
import { ZeroExV3 } from './zeroExV3'
import { orderFactory } from './utils/order_factory'

export class NFTradeEx extends ZeroExV3 {
  constructor(wallet: WalletInfo, config?: APIConfig) {
    super(wallet, { ...config, contractAddresses: NFTREADE_CONTRACTS_ADDRESSES[wallet.chainId] })
    this.eip712DomainName = 'NFTrade'
    this.eip712DomainVersion = '1.0.0'
    this.protocolFeePoints = 0
  }

  public async orderMatch(
    orders: DealOrder[],
    nftAmount?: string
  ) {
    const calldata = await this.orderMatchCallData(orders, nftAmount)
    await this.estimateGas(calldata)
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
    const makerData: Asset = orderFactory.getAsset(order.makerAssetData)
    // const takerAmount = makerAssetBuyAmount
    let callData
    // const nftAmount = takerAmount //&& makerData.schemaName == TokenSchemaName.ERC721
    if (takerData.tokenAddress.toLowerCase() == this.GasWarpperToken.address.toLowerCase()) {
      const ethFeeAmounts = [] //data.takerFee
      const feeRecipients = [] //data.feeRecipientAddress
      const params = [orders, makerAssetBuyAmount, signatures, ethFeeAmounts, feeRecipients]
      // // Zero Ex Froward
      callData = await this.forwarderEx.populateTransaction.marketBuyOrdersWithEth(...params, { value })
    } else {
      let takerAmount = order.takerAssetAmount
      // const takerData = orderFactory.getAssetData(order.takerAssetData, order.takerAssetAmount)
      if (takerData.schemaName == 'ERC20') {
        // new forwarder
        const erc20Operator = this.getProxyAddress(takerData.schemaName)
        // check buyer ERC20
        const erc20Aprove = await this.userAccount.getTokenApprove(takerData.tokenAddress, erc20Operator)
        const amount = new BigNumber(takerAmount).plus(order.takerFee)
        if (amount.lt(erc20Aprove.balances)) {
          throw new Error('Buyer\'s erc20 token not enough')
        }
        if (amount.lt(erc20Aprove.allowance)) {
          const tx = await this.userAccount.ethSend(erc20Aprove.calldata)
          await tx.wait()
        }
        takerAmount = amount.div(order.makerAssetAmount).times(makerAssetBuyAmount).toString()
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

