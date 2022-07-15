import { Asset, Token } from 'web3-accounts'
import { BigNumber } from 'web3-wallets'

export interface ERC20AssetData {
  assetProxyId: string;
  tokenAddress: string;
}


export interface ERC721AssetData {
  assetProxyId: string;
  tokenAddress: string;
  tokenId: BigNumber;
}

export interface ERC1155AssetData {
  assetProxyId: string;
  tokenAddress: string;
  tokenIds: BigNumber[];
  tokenValues: BigNumber[];
  callbackData: string;
}

export interface BaseOrder {
  makerAddress: string;
  takerAddress: string;
  feeRecipientAddress: string;
  senderAddress: string;
  makerAssetAmount: string;
  takerAssetAmount: string;
  makerFee: string;
  takerFee: string;
  expirationTimeSeconds: string;
  salt: string;
  makerAssetData: string;
  takerAssetData: string;
  makerFeeAssetData: string;
  takerFeeAssetData: string;
}

export interface Order extends BaseOrder {
  chainId: number;
  exchangeAddress: string;
}

export interface DealOrder extends Order {
  signature: string;
}


export enum OrderStatus {
  Invalid = 0,
  InvalidMakerAssetAmount = 1,
  InvalidTakerAssetAmount = 2,
  Fillable = 3,
  Expired = 4,
  FullyFilled = 5,
  Cancelled = 6
}

export type { Signature, WalletInfo, LimitedCallSpec, EIP712TypedData, EIP712Domain } from 'web3-wallets'
export {
  NULL_ADDRESS, getProvider, getEstimateGas,
  ethSend,
  BigNumber,
  ETH_TOKEN_ADDRESS,
  CHAIN_CONFIG,
  getChainRpcUrl,
  hexUtils,
  getEIP712DomainHash,
  createEIP712TypedData
} from 'web3-wallets'


export type {
  ExchangetAgent,
  APIConfig,
  ExchangeMetadata,
  Asset,
  Token,
  MatchOrderOption,
  BuyOrderParams,
  CreateOrderParams,
  SellOrderParams,
  MixedPayment,
  MatchParams
} from 'web3-accounts'
export {
  Web3Accounts, OfferType, OrderSide, ETHToken,
  metadataToAsset, assetToMetadata, tokenToMetadata, transactionToCallData
} from 'web3-accounts'


export interface OrderMainInfo {
  makerAddress: string,
  makerAssetAmount: string,
  makerAssetData: string,
  takerAssetAmount: string,
  takerAssetData: string,
  exchangeAddress: string
}

export interface MakerOrderParams {
  makerAsset: Asset,
  makerAssetAmount: BigNumber,
  takerToken: Token,
  takerAssetAmount: BigNumber,
  expirationTime: number,
  protocolFeePoints: number
  buyerAddress?: string
}

export interface CreateOrderOpts {
  takerAddress: string;
  senderAddress: string;
  makerFee: BigNumber;
  takerFee: BigNumber;
  salt: BigNumber;
  expirationTimeSeconds: string;
  feeRecipientAddress?: string;
  makerFeeAssetData?: string;
  takerFeeAssetData?: string;
}
