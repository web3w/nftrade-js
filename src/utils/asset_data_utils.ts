import { AssetProxyId, constants } from './constants'

import { Asset } from 'web3-accounts'

import { hexUtils, BigNumber } from 'web3-wallets'


import { Web3ABICoder, JsonFragment } from 'web3-abi-coder'

export class assetDataUtils {
  static assetToAssetDate(asset: Asset, makerAssetAmount?: BigNumber): string {
    // const takerAssetData = assetDataUtils.encodeERC20AssetData(paymentToken?.address || NULL_ADDRESS)
    let makerAssetData = ''
    if (asset.schemaName.toLowerCase() == 'erc721') {
      makerAssetData = assetDataUtils.encodeERC721AssetData(asset.tokenAddress, new BigNumber(asset.tokenId || 0))
    } else if (asset.schemaName.toLowerCase() == 'erc1155') {
      makerAssetData = assetDataUtils.encodeERC1155AssetData(asset.tokenAddress, [new BigNumber(asset.tokenId || 0)], [makerAssetAmount || new BigNumber(1)], '0x')
    } else if (asset.schemaName.toLowerCase() == 'erc20') {
      makerAssetData = assetDataUtils.encodeERC20AssetData(asset.tokenAddress)
    } else {
      throw asset.schemaName + 'not support'
    }
    return makerAssetData
  }

  static encodeERC20AssetData(tokenAddress: string): string {
    // const functionSignature = 'ERC20Token(address)'
    const abiEncoder = new Web3ABICoder([constants.ERC20_METHOD_ABI])
    // const functionSignature = abiEncoder.getSignature()
    // [tokenAddress.toLowerCase()]
    //self._strictEncodeArguments(functionSignature, [values, nestedAssetData]);
    return abiEncoder.encodeInput('ERC20Token', [tokenAddress])
  }

  static encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string {
    const abiEncoder = new Web3ABICoder([constants.ERC721_METHOD_ABI])
    return abiEncoder.encodeInput('ERC721Token', [tokenAddress, tokenId.toString()])
  }

  static encodeERC1155AssetData(tokenAddress: string, tokenIds: BigNumber[], values: BigNumber[], callbackData: string): string {
    const abiEncoder = new Web3ABICoder([constants.ERC1155_METHOD_ABI])
    return abiEncoder.encodeInput('ERC1155Assets', [tokenAddress, tokenIds.map(val => val.toString()), values.map(val => val.toString()), callbackData])
  }


  /**
   * Decode any assetData into its corresponding assetData object
   * @param assetData Hex encoded assetData string to decode
   * @return Either a ERC20, ERC20Bridge, ERC721, ERC1155, StaticCall, or MultiAsset assetData object
   */
  static decodeAssetDataOrThrow(assetData: string) {
    const assetProxyId = hexUtils.slice(assetData, 0, 4) // tslint:disable-line:custom-no-magic-numbers
    const abiEncoder = new Web3ABICoder([constants.ERC20_METHOD_ABI, constants.ERC721_METHOD_ABI, constants.ERC1155_METHOD_ABI])
    const asset = abiEncoder.decodeInput<any>(assetData).values
    switch (assetProxyId) {
      case AssetProxyId.ERC20: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const tokenAddress = asset['tokenContract']

        return {
          assetProxyKey: 'erc20',
          assetProxyId,
          tokenAddress
        }
      }
      case AssetProxyId.ERC721: {
        const tokenAddress = asset['tokenContract']
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const tokenId = asset['tokenId'].toString()
        return {
          assetProxyKey: 'erc721',
          assetProxyId,
          tokenAddress,
          tokenId
        }
      }
      case AssetProxyId.ERC1155: {
        const tokenAddress = asset['tokenAddress']
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const tokenIds = asset['tokenIds'].toString()
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const tokenValues = asset['tokenValues'].toString()
        return {
          assetProxyKey: 'erc1155',
          assetProxyId,
          tokenAddress,
          tokenIds,
          tokenValues
        }
      }
      // eslint-disable-next-line no-fallthrough
      default:
        throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`)
    }
  }
}
