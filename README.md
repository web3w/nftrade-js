# nftrade-js

SDK for the Nftrader protocol and ZeroEx v3 protocol

https://nftrade.com/
## Installation

In your project, run:

```bash
npm i nftrade-js
```

## Getting Started

To get started, create a new NFTrade JS client, called an NFTrade, using your chainId and address:

```JavaScript
import {NFTradeSDK} from 'nftrade-js'

const nftrade = new NFTradeSDK({
    chainId: 4,
    address: "0x9F7A946d935c8Efc7A8329C0d894A69bA241345A"
})
```

In the browser environment, only the chainId and address need to be configured，If you want to use the bash environment,
configure the private key and RPC

In the browser environment, only the chainId and address need to be configured，If you want to use the bash environment,
configure the private key and RPC

```ts
type WalletInfo = {
    chainId: number;
    address: string;
    privateKeys?: string[];
    rpcUrl?: RpcInfo; // User-defined RPC information of the provider
}
``` 
### Making Offers

Once you have your asset, you can do this to make an offer on it:

```JavaScript
// Token ID and smart contract address for a non-fungible token:
const {tokenId, tokenAddress} = YOUR_ASSET

const offer = await nftrade.createBuyOrder({
    asset: {
        tokenId,
        tokenAddress,
        schemaName // WyvernSchemaName. If omitted, defaults to 'ERC721'. Other options include 'ERC20' and 'ERC1155'
    },
    // Value of the offer, in units of the payment token (or wrapped ETH if none is specified):
    startAmount: 1.2,
})
```

### Making Listings / Selling Items

To sell an asset, call `createSellOrder`. You can do a fixed-price listing, where `startAmount` is equal to `endAmount`,
or a declining [Dutch auction](https://en.wikipedia.org/wiki/Dutch_auction), where `endAmount` is lower and the price
declines until `expirationTime` is hit:

```JavaScript
// Expire this auction one day from now.
// Note that we convert from the JavaScript timestamp (milliseconds):
const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24)

const listing = await nftrade.createSellOrder({
    asset: {
        tokenId,
        tokenAddress,
        schemaName,
        "collection": {
            royaltyFeeAddress,
            royaltyFeePoints
        }
    },
    startAmount: 3,
    // If `endAmount` is specified, the order will decline in value to that amount until `expirationTime`. Otherwise, it's a fixed-price order:
    endAmount: 0.1,
    expirationTime
})
```

##

https://etherscan.io/address/0x13d8faf4a690f5ae52e2d2c52938d1167057b9af#code
 


