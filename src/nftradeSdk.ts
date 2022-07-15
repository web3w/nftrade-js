import EventEmitter from 'events'
import {
  DealOrder, ExchangetAgent,
  APIConfig,
  WalletInfo,
  BuyOrderParams,
  SellOrderParams,
  LimitedCallSpec, MatchParams, CreateOrderParams, OrderSide,
  MatchOrderOption, BigNumber, ExchangeMetadata, metadataToAsset, Web3Accounts
} from './types'
import { NFTradeEx } from './nftradeEx'

export class NFTradeSDK extends EventEmitter implements ExchangetAgent {
  public contracts: NFTradeEx
  public userAccount: Web3Accounts
  public walletInfo: WalletInfo

  // init SDK
  constructor(wallet: WalletInfo, config?: APIConfig) {
    super()
    this.contracts = new NFTradeEx(wallet, config)
    this.userAccount = this.contracts.userAccount
    this.walletInfo = wallet
  }

  async getAssetApprove(metadatas: ExchangeMetadata[]) {
    const asset = metadataToAsset(metadatas[0])
    const data = await this.userAccount.getAssetApprove(asset, this.contracts.signerAddress)

    return [data]
    // return [{
    //   isApprove,
    //   calldata: this.contracts.approveAssetTransferProxyCalldata(asset.tokenAddress, asset.schemaName),
    //   balances
    // }]
  }

  async getOrderApprove(params: CreateOrderParams, side: OrderSide) {
    return this.contracts.getOrderApproveStep(params, side)
  }

  async getMatchCallData({ orderStr, takerAmount }: { orderStr: string, takerAmount?: string }
  ): Promise<{ callData: LimitedCallSpec, order: DealOrder }> {
    const order = <DealOrder><unknown>JSON.parse(orderStr)
    // const amount = takerAmount ? new BigNumber(takerAmount) : undefined
    const callData: LimitedCallSpec = await this.contracts.orderMatchCallData([order], takerAmount)
    return { callData, order }
  }

  async createSellOrder(params: SellOrderParams): Promise<DealOrder> {
    return this.contracts.createSellOrder(params)
  }

  async createBuyOrder(params: BuyOrderParams): Promise<DealOrder> {
    return this.contracts.createBuyOrder(params)
  }

  public async checkOrderMatch(orderStr: string, params?: MatchParams) {
    const order = JSON.parse(orderStr) as DealOrder
    // const amount = params?.takerAmount ? new BigNumber(params.takerAmount) : undefined
    return this.contracts.checkMatchOrder(order, params?.takerAmount).catch(err => {
      this.emit('EstimateGasError', err)
      console.log('checkSellOrder')
      throw err
    })
  }

  async fulfillOrder(orderStr: string, option?: MatchOrderOption) {
    const { callData } = await this.getMatchCallData({ orderStr, takerAmount: option?.takerAmount })
    await this.contracts.estimateGas(callData)
    // console.log("callData",callData)
    return this.contracts.ethSend(callData)
  }

  async cancelOrderEstimateGas(orderStr: string) {
    const order = <DealOrder><unknown>JSON.parse(orderStr)
    const callData = await this.contracts.cancelOrderCallData(order)
    callData.from = order.makerAddress
    return this.contracts.estimateGas(callData)
  }

  async cancelOrder(orderStr: string) {
    const order = <DealOrder><unknown>JSON.parse(orderStr)
    try {
      const callData = await this.contracts.cancelOrderCallData(order)
      // await this.contracts.estimateGas(callData)
      return this.contracts.ethSend(callData)
    } catch (err: any) {
      throw err
    }
  }


  async cancelOrders(orders: string[]) {
    return this.cancelOrder(orders[0])
  }

}
