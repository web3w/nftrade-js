import { BigNumber, APIConfig, Token, WalletInfo, BaseOrder } from '../types'
import { TokenSchemaNames } from 'web3-wallets'


export { BigNumber }

export type { APIConfig, WalletInfo, Token }


export enum Network {
  Private = 'private',
  Main = 'main',
  Rinkeby = 'rinkeby',
  Polygon = 'polygon',
  Mumbai = 'mumbai',
  BSCTEST = 'bsc_test',
  BSC = 'bsc',
}



/**
 * Full annotated Fungible Token spec with OpenSea metadata
 */
export interface ElemetnFungibleToken extends Token {
  imageUrl?: string
  ethPrice?: string
  usdPrice?: string
}

/******************** Fees ***********************/
/**
 * The basis point values of each type of fee
 */
export interface ElementFees {
  // Fee for Element levied on sellers
  royaltyFeePoints: number
  // Fee for Element levied on buyers
  elementBuyerFeeBasisPoints: number
  // Fee for the collection owner levied on sellers
  devSellerFeeBasisPoints: number
  // Fee for the collection owner levied on buyers
  devBuyerFeeBasisPoints: number
}

/**
 * Annotated collection with OpenSea metadata
 */
export interface ElementCollection extends ElementFees {
  // Name of the collection
  name: string
  // Description of the collection
  description: string
  // Image for the collection
  imageUrl: string
  // The per-transfer fee, in base units, for this asset in its transfer method
  transferFee: BigNumber | string | null
  royaltyFeeAddress?: string
  // The transfer fee token for this asset in its transfer method
  transferFeePaymentToken: ElemetnFungibleToken | null
}




export interface Chain_Info {
  'chain_id': string,
  'chain': string
}

export interface chainAddress {
  'address': string,
  'chain': Chain_Info
}

export interface oxFee extends chainAddress {
  'basis_points': number
}

export interface oxAssetStandards extends chainAddress {
  'standards': TokenSchemaNames
}

export interface oxAsset extends chainAddress {
  'contract': oxAssetStandards,
  'asset_id'?: string,
  'quantity': string
}

export interface PostOrderV2 {
  'maker_address': chainAddress,
  'taker_address': chainAddress,
  'maker_asset': [oxAsset],
  'taker_asset': [oxAsset],
  'maker_fees': [oxFee] | [],
  'taker_fees': [oxFee] | [],
  'exchange_contract': {
    'address': string,// 交易合约地址
    'chain': Chain_Info,
    'standards': string[] // 使用0x协议
  },
  'signature': string,
  'side': OrderSide, // 0买单，1卖单
  'exchange_data': BaseOrder,
  'chain': Chain_Info
}


//----------- OrderJSON--------------


interface ElementNFTAsset {
  id: string
  address: string
  quantity?: string
  data?: string
  collection?: ElementCollection
}

interface ElementFTAsset {
  id?: string
  address: string
  quantity: string
  data?: string
  collection?: ElementCollection
}

export type ElementAsset = ElementNFTAsset | ElementFTAsset


/**
 * Annotated collection with OpenSea metadata
 */
export interface ElementCollection extends ElementFees {
  // Name of the collection
  name: string
  // Description of the collection
  description: string
  // Image for the collection
  imageUrl: string
  // The per-transfer fee, in base units, for this asset in its transfer method
  transferFee: BigNumber | string | null
  // The transfer fee token for this asset in its transfer method
  transferFeePaymentToken: ElemetnFungibleToken | null
}


// export interface ECSignature {
//   v: number
//   r: string
//   s: string
// }
//
// export interface OrderJSON extends Partial<ECSignature> {
//   exchange: string
//   maker: string
//   taker: string
//   makerRelayerFee: string
//   takerRelayerFee: string
//   makerProtocolFee: string
//   takerProtocolFee: string
//   makerReferrerFee: string
//   feeRecipient: string
//   feeMethod: number
//   side: number
//   saleKind: number
//   target: string
//   howToCall: number
//   dataToCall: string
//   replacementPattern: string
//   staticTarget: string
//   staticExtradata: string
//   paymentToken: string
//
//   quantity: string
//   basePrice: string
//   englishAuctionReservePrice: string | undefined
//   extra: string
//
//   // createdTime is undefined when order hasn't been posted yet
//   // createdTime?: number | string
//   listingTime: number | string
//   expirationTime: number | string
//
//   salt: string
//
//   metadata: ExchangeMetadata
//
//   hash: string
//   orderHash?: string
//   chain?: string
//   chainId?: string
// }

export enum OrderSide {
  All = -1,
  Buy = 0,
  Sell = 1
}
