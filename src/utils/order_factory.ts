import { constants } from './constants'
import { computerExpirationAndSalt, generatePseudoRandomSalt } from './salt'

import {
  BaseOrder,
  CreateOrderOpts,
  DealOrder,
  ERC20AssetData,
  ERC721AssetData,
  MakerOrderParams,
} from '../types'
import { Chain_Info, OrderSide, oxFee, PostOrderV2 } from './types'
import { assetDataUtils } from './asset_data_utils'

import { rateUtils } from './rate_utils'
import { Asset, ExchangeMetadata, NULL_ADDRESS, BigNumber } from '../types'


export const orderFactory = {
  // getStringValuesFromEnum<T>(myEnum: T): keyof T {
  //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //   // @ts-ignore
  //   return Object.keys(AssetProxyId).filter(val => AssetProxyId[val] == myEnum) as any
  //   // return Object.keys(T).filter(k => (myEnum as any)[k] === myEnum) as any
  // },

  getAsset(assetData: string, decimals?: number): Asset {
    const asset = assetDataUtils.decodeAssetDataOrThrow(assetData)
    const schemaName = asset.assetProxyKey.toLowerCase()
    switch (schemaName) {
      case 'erc20': {
        const tokenAddress = (<ERC20AssetData>asset).tokenAddress
        return {
          tokenAddress,
          schemaName,
          decimals
        } as Asset
      }

      case 'erc721': {
        const tokenAddress = (<ERC721AssetData>asset).tokenAddress
        const tokenId = (<ERC721AssetData>asset).tokenId.toString()
        return {
          tokenAddress,
          tokenId,
          schemaName
        }
      }
      case 'erc1155': {
        const tokenAddress = asset.tokenAddress
        const tokenId = (<any>asset).tokenIds.toString()
        // const asset_value = (<ERC1155AssetData>asset).tokenValues[0].toString()
        return {
          tokenAddress,
          tokenId,
          schemaName
        }
      }
      default: {
        throw new Error('getAsset')
      }
    }
  },

  getAssetMatedata(assetData: string, quantity: string): ExchangeMetadata {
    const asset = assetDataUtils.decodeAssetDataOrThrow(assetData)
    const schema = asset.assetProxyKey.toLowerCase()
    switch (schema) {
      case 'erc20': {
        const address = asset.tokenAddress
        return {
          asset: {
            address,
            quantity
          },
          schema
        }
      }

      case 'erc721': {
        const address = asset.tokenAddress
        const id = (<ERC721AssetData>asset).tokenId.toString()
        return {
          asset: {
            address,
            id,
            quantity
          },
          schema
        }
      }
      case 'erc1155': {
        const address = asset.tokenAddress
        const id = (<any>asset).tokenIds.toString()
        // const asset_value = (<ERC1155AssetData>asset).tokenValues[0].toString()
        return {
          asset: {
            address,
            id,
            quantity
          },
          schema
        }
      }
      default: {
        throw new Error('getAssetMatedata')
      }
    }
  },

  getAssetData(assetData: string, quantity: string): any {
    const asset = assetDataUtils.decodeAssetDataOrThrow(assetData)
    const standards = asset.assetProxyKey.toLowerCase()
    switch (standards) {
      case 'erc20': {
        const address = asset.tokenAddress
        return {
          'contract': {
            address,
            standards: [standards]
          },
          quantity
        }
      }

      case 'erc721': {
        const address = asset.tokenAddress
        const asset_id = (<ERC721AssetData>asset).tokenId
        return {
          'contract': {
            address,
            standards: [standards]
          },
          asset_id,
          quantity
        }
      }
      case 'erc1155': {
        const address = asset.tokenAddress
        const asset_id = (<any>asset).tokenIds
        // const asset_value = (<ERC1155AssetData>asset).tokenValues[0].toString()
        return {
          'contract': {
            address,
            standards: [standards]
          },
          asset_id,
          quantity
        }
      }
    }
    // AssetProxyKey

  },


  getRoyaltyFee(chain: Chain_Info, address: string, basis_points: number): oxFee {
    return {
      address,
      chain,
      basis_points
    }
  },
  converPostOrder(order: DealOrder, orderInfo: { chainType: string, orderType: OrderSide, standards: string[] }): PostOrderV2 {
    const baseOrder: BaseOrder = orderFactory.converBaseOrder(order)

    const chain: Chain_Info = {
      'chain': orderInfo.chainType,
      'chain_id': order.chainId.toString()
    }
    const takerFee = new BigNumber(order.takerFee)
    const makerFee = new BigNumber(order.makerFee)
    const takerAssetAmount = new BigNumber(order.takerAssetAmount)
    const makerAssetAmount = new BigNumber(order.makerAssetAmount)

    const takerAsset = orderFactory.getAssetData(order.takerAssetData, order.takerAssetAmount.toString())
    takerAsset.contract.chain = chain
    let taker_fees: [oxFee] | [] = []
    if (takerFee.gt(0)) {
      const basis_points = takerFee.div(takerAssetAmount.plus(order.takerFee)).times(10000).toNumber()
      const fee: oxFee = this.getRoyaltyFee(chain, takerAsset.contract.address, basis_points)
      taker_fees = [fee]
      takerAsset.quantity = takerAssetAmount.plus(order.takerFee).toString()
    }

    const makerAsset = orderFactory.getAssetData(order.makerAssetData, order.makerAssetAmount.toString())
    makerAsset.contract.chain = chain
    let maker_fees: [oxFee] | [] = []
    if (makerFee.gt(0)) {
      const basis_points = makerFee.div(makerAssetAmount.plus(order.makerFee)).times(10000).toNumber()
      const fee: oxFee = this.getRoyaltyFee(chain, makerAsset.contract.address, basis_points)
      maker_fees = [fee]
      makerAsset.quantity = makerAssetAmount.plus(order.makerFee).toString()
    }

    const postOrder: PostOrderV2 = {
      maker_address: {
        address: order.makerAddress,
        chain
      },
      taker_address: {
        address: order.takerAddress,
        chain
      },
      maker_asset: [makerAsset],
      taker_asset: [takerAsset],
      maker_fees,
      taker_fees,
      exchange_contract: {
        'address': order.exchangeAddress,
        chain,
        standards: orderInfo.standards// 使用0x协议
      },
      signature: order.signature,
      side: orderInfo.orderType,
      exchange_data: baseOrder,
      chain
    }
    return postOrder
  },
  // createOrderFromPartial(partialOrder: Partial<Order>): Order {
  //   const chainId: number = getChainIdFromPartial(partialOrder)
  //   const defaultOrder = generateEmptyOrder(chainId)
  //   return {
  //     ...defaultOrder,
  //     ...partialOrder
  //   }
  // },
  // createSignedOrderFromPartial(partialSignedOrder: Partial<SignedOrder>): SignedOrder {
  //   const chainId: number = getChainIdFromPartial(partialSignedOrder)
  //   const defaultOrder = generateEmptySignedOrder(chainId)
  //   return {
  //     ...defaultOrder,
  //     ...partialSignedOrder
  //   }
  // },
  createOrder(
    makerAddress: string,
    makerAssetAmount: BigNumber,
    makerAssetData: string,
    takerAssetAmount: BigNumber,
    takerAssetData: string,
    exchangeAddress: string,
    chainId: number,
    createOrderOpts = generateDefaultCreateOrderOpts()
  ) {
    const defaultCreateOrderOpts = generateDefaultCreateOrderOpts()
    const expirationTimeSeconds = new BigNumber(createOrderOpts.expirationTimeSeconds || defaultCreateOrderOpts.expirationTimeSeconds || constants.DefaultExpirationTimeSeconds)
    const order = {
      makerAddress,
      makerAssetAmount,
      takerAssetAmount,
      makerAssetData,
      takerAssetData,
      makerFeeAssetData: createOrderOpts.makerFeeAssetData || makerAssetData,
      takerFeeAssetData: createOrderOpts.takerFeeAssetData || takerAssetData,
      takerAddress: createOrderOpts.takerAddress || defaultCreateOrderOpts.takerAddress,
      senderAddress: createOrderOpts.senderAddress || defaultCreateOrderOpts.senderAddress,
      makerFee: createOrderOpts.makerFee || defaultCreateOrderOpts.makerFee,
      takerFee: createOrderOpts.takerFee || defaultCreateOrderOpts.takerFee,
      feeRecipientAddress: createOrderOpts.feeRecipientAddress || defaultCreateOrderOpts.feeRecipientAddress || constants.FeeRecipientAddress,
      salt: createOrderOpts.salt || defaultCreateOrderOpts.salt || new BigNumber(0),
      expirationTimeSeconds,
      exchangeAddress,
      chainId
    }
    return order
  },
  // async createSignedOrderAsync(
  //   supportedProvider: SupportedProvider,
  //   makerAddress: string,
  //   makerAssetAmount: BigNumber,
  //   makerAssetData: string,
  //   takerAssetAmount: BigNumber,
  //   takerAssetData: string,
  //   exchangeAddress: string,
  //   createOrderOpts?: CreateOrderOpts
  // ): Promise<SignedOrder> {
  //   const order = orderFactory.createOrder(
  //     makerAddress,
  //     makerAssetAmount,
  //     makerAssetData,
  //     takerAssetAmount,
  //     takerAssetData,
  //     exchangeAddress,
  //     await providerUtils.getChainIdAsync(supportedProvider),
  //     createOrderOpts
  //   )
  //   const orderHash = orderHashUtils.getOrderHash(order)
  //   const signature = await signatureUtils.ecSignHashAsync(supportedProvider, orderHash, makerAddress)
  //   const signedOrder: SignedOrder = { ...order, signature }
  //   return signedOrder
  // },
  //
  // async create712SignedOrderAsync(
  //   chainId: number,
  //   supportedProvider: SupportedProvider,
  //   makerAddress: string,
  //   makerAssetAmount: BigNumber,
  //   makerAssetData: string,
  //   takerAssetAmount: BigNumber,
  //   takerAssetData: string,
  //   exchangeAddress: string,
  //   createOrderOpts?: CreateOrderOpts
  // ): Promise<SignedOrder> {
  //   // const chainId = await providerUtils.getChainIdAsync(supportedProvider)
  //   const order = orderFactory.createOrder(
  //     makerAddress,
  //     makerAssetAmount,
  //     makerAssetData,
  //     takerAssetAmount,
  //     takerAssetData,
  //     exchangeAddress,
  //     chainId,
  //     createOrderOpts
  //   )
  //   const signature = await signatureUtils.ecSignTypedDataOrderAsync(supportedProvider, order, makerAddress)
  //   return signatureUtils.signedOrder(signature, order)
  //   // return signatureUtils.ecSignTypedDataOrderAsync(supportedProvider, order, makerAddress)
  // },

  makerSellOrder(params: MakerOrderParams) {
    const { makerAsset, makerAssetAmount, takerToken, takerAssetAmount, expirationTime, buyerAddress } = params

    if (makerAssetAmount.isZero() || takerAssetAmount.isZero()) {
      throw 'Incorrect order amount'
    }

    // const exchangeAddress = this.exchange.address
    // const makerAddress = this.signerAddress
    const takerAddress = buyerAddress || NULL_ADDRESS
    const senderAddress = NULL_ADDRESS

    // trading pair
    // let makerAssetAmount = new BigNumber(assetQuantity)
    const makerAssetData = assetDataUtils.assetToAssetDate(makerAsset)
    const takerAssetData = assetDataUtils.encodeERC20AssetData(takerToken.address)

    // expriation
    const { expirationTimeSeconds } = computerExpirationAndSalt(expirationTime)

    // fee
    const {
      royaltyFee,
      salt,
      tokenAmount
    } = rateUtils.computerFeeSalt(makerAsset, takerAssetAmount, params.protocolFeePoints)
    const takerFeeAssetData = royaltyFee.gte(0) ? takerAssetData : '0x'
    const makerFeeAssetData = '0x'
    // console.log('Sell Royalty Fee', royaltyFee.div(takerAssetAmount).toString(), royaltyFee.toString())
    console.assert(royaltyFee.plus(tokenAmount).eq(takerAssetAmount), 'Sell royalt compture error')
    // takerAssetAmount = tokenAmount
    const takerFee = royaltyFee.integerValue()
    const orderOpts = {
      salt,
      expirationTimeSeconds,
      takerAddress,
      senderAddress,
      takerFee,
      takerFeeAssetData,
      makerFeeAssetData
    } as CreateOrderOpts
    //: CreateOrderOpts
    const assetInfo = {
      makerAssetAmount,
      makerAssetData,
      takerAssetAmount: tokenAmount.integerValue(),
      takerAssetData
    }

    return { orderOpts, assetInfo }
  },

  makerBuyOrder(params: MakerOrderParams) {
    const { makerAsset, makerAssetAmount, takerToken, takerAssetAmount, expirationTime, buyerAddress } = params
    const takerAddress = buyerAddress || NULL_ADDRESS
    const senderAddress = NULL_ADDRESS

    const makerAssetData = assetDataUtils.encodeERC20AssetData(takerToken.address)
    const takerAssetData = assetDataUtils.assetToAssetDate(makerAsset)
    // expriation
    const { expirationTimeSeconds } = computerExpirationAndSalt(expirationTime)

    // fee
    const {
      royaltyFee,
      salt,
      tokenAmount
    } = rateUtils.computerFeeSalt(makerAsset, makerAssetAmount, params.protocolFeePoints)
    const makerFeeAssetData = royaltyFee.gte(0) ? makerAssetData : '0x'
    // console.log('Buy Royalty Fee', royaltyFee.div(makerAssetAmount).toString(), royaltyFee.toString())
    console.assert(royaltyFee.plus(tokenAmount).eq(makerAssetAmount), 'Buy royalt compture error')

    const takerFeeAssetData = '0x'
    const makerFee = royaltyFee.integerValue()
    // makerAssetAmount = tokenAmount
    const orderOpts = {
      salt,
      expirationTimeSeconds,
      takerAddress,
      senderAddress,
      makerFee,
      takerFee: new BigNumber(0),
      takerFeeAssetData,
      makerFeeAssetData
    } as CreateOrderOpts
    const assetInfo = {
      makerAssetAmount: tokenAmount.integerValue(),
      makerAssetData,
      takerAssetAmount,
      takerAssetData
    }
    return { orderOpts, assetInfo }
  },


  converStrOrder(order: any): DealOrder {
    const ethersOrder = {}
    for (const key in order) {
      ethersOrder[key] = order[key] instanceof BigNumber ? order[key].toString() : order[key]
    }
    return ethersOrder as DealOrder
  },

  converBaseOrder(order: DealOrder): BaseOrder {
    return {
      makerAddress: order.makerAddress,
      takerAddress: order.takerAddress,
      feeRecipientAddress: order.feeRecipientAddress,
      senderAddress: order.senderAddress,
      makerAssetAmount: order.makerAssetAmount.toString(),
      takerAssetAmount: order.takerAssetAmount.toString(),
      makerFee: order.makerFee.toString(),
      takerFee: order.takerFee.toString(),
      expirationTimeSeconds: order.expirationTimeSeconds.toString(),
      salt: order.salt.toString(),
      makerAssetData: order.makerAssetData,
      takerAssetData: order.takerAssetData,
      makerFeeAssetData: order.makerFeeAssetData,
      takerFeeAssetData: order.takerFeeAssetData
    }
  }
}


function generateDefaultCreateOrderOpts(): CreateOrderOpts {

  // {
  //   takerAddress?: string;
  //   senderAddress?: string;
  //   makerFee?: BigNumber;
  //   takerFee?: BigNumber;
  //   feeRecipientAddress?: string;
  //   salt?: BigNumber;
  //   expirationTimeSeconds?: string;
  //   makerFeeAssetData?: string;
  //   takerFeeAssetData?: string;
  // }

  return <CreateOrderOpts>{
    takerAddress: NULL_ADDRESS,
    senderAddress: NULL_ADDRESS,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
    feeRecipientAddress: NULL_ADDRESS,
    salt: generatePseudoRandomSalt(),
    expirationTimeSeconds: constants.DefaultExpirationTimeSeconds
  }
}




