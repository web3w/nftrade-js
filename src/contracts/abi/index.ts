import ElementEx from './zeroEx/ElementEx.json'
import Exchange from './zeroEx/Exchange.json'
import Forwarder from './zeroEx/Forwarder.json'
import IZeroExV3 from './zeroEx/ZeroExV3MarketProxy.json'
import ExSwap from './ExSwap.json'


export interface AbiInfo {
  contractName: string
  sourceName?: string
  abi: any
}

export const ContractABI = {
  elementEx: ElementEx as AbiInfo,
  exchange: Exchange as AbiInfo,
  forwarder: Forwarder as AbiInfo,
  swapEx: ExSwap as AbiInfo,
  zeroExV3: IZeroExV3 as AbiInfo
}


