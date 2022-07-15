


export enum AssetProxyId {
  ERC20 = '0xf47261b0',
  ERC721 = '0x02571792',
  MultiAsset = '0x94cfcdd7',
  ERC1155 = '0xa7cb5fb7',
  StaticCall = '0xc339d10a',
  ERC20Bridge = '0xdc1600f3',
}

const feeRecipientAddress = '0x548427d1418066763173dd053D9d1AE32D161310'
// const feeRate = 250

const ERC20_METHOD_ABI = {
  constant: false,
  inputs: [
    {
      name: 'tokenContract',
      type: 'address'
    }
  ],
  name: 'ERC20Token',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}

const ERC721_METHOD_ABI = {
  constant: false,
  inputs: [
    {
      name: 'tokenContract',
      type: 'address'
    },
    {
      name: 'tokenId',
      type: 'uint256'
    }
  ],
  name: 'ERC721Token',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}

const ERC1155_METHOD_ABI = {
  constant: false,
  inputs: [
    { name: 'tokenAddress', type: 'address' },
    { name: 'tokenIds', type: 'uint256[]' },
    { name: 'tokenValues', type: 'uint256[]' },
    { name: 'callbackData', type: 'bytes' }
  ],
  name: 'ERC1155Assets',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function'
}

export const constants = {
  EXCHANGE_ORDER_SCHEMA: {
    name: 'Order',
    parameters: [
      { name: 'makerAddress', type: 'address' },
      { name: 'takerAddress', type: 'address' },
      { name: 'feeRecipientAddress', type: 'address' },
      { name: 'senderAddress', type: 'address' },
      { name: 'makerAssetAmount', type: 'uint256' },
      { name: 'takerAssetAmount', type: 'uint256' },
      { name: 'makerFee', type: 'uint256' },
      { name: 'takerFee', type: 'uint256' },
      { name: 'expirationTimeSeconds', type: 'uint256' },
      { name: 'salt', type: 'uint256' },
      { name: 'makerAssetData', type: 'bytes' },
      { name: 'takerAssetData', type: 'bytes' },
      { name: 'makerFeeAssetData', type: 'bytes' },
      { name: 'takerFeeAssetData', type: 'bytes' }
    ]
  },

  ERC20_METHOD_ABI,
  ERC721_METHOD_ABI,
  ERC1155_METHOD_ABI,
  DefaultExpirationTimeSeconds: Math.round(new Date().getTime() / 1000 + 60 * 60 * 24 * 100).toString(),
  FeeRecipientAddress: feeRecipientAddress
}
