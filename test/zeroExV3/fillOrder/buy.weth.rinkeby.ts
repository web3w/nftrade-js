import { BigNumber } from '../../src/utils'
import { ethers } from 'ethers'
import { ContractBase } from '../../../src/contracts'
import secrets from '../../../../secrets.json'
import { ZeroExchange } from '../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../src/order-utils'
import { Account } from '../../../src/account'


const NULL_ADDRESS = ethers.constants.AddressZero

const sellAccount = '0xeb1e5B96bFe534090087BEb4FB55CC3C32bF8bAA'
const buyAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'


const tokenId = new BigNumber('3')

const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn200 = new BigNumber(200)


const mockAsset = {
    'bnb': '0x44C73A7b3B286c78944aD79b2BBa0204916Cebca',
    'erc20': '0xB506BFAA7661dabF4DE80672BD3f13F4610a5fDf',
    'erc721': '0x6b0d7Ed64D8faCde81B76f8eA6598808Ee93fB0b',
    'erc1155': '0x14F17a5A2c65fF8509D9F6046f4101C3CfA84328'
  }


;(async () => {
  try {
    // const wallet = new ethers.Wallet(secrets.accounts[buyAccount], provider)
    const erc721AssetData = assetDataUtils.encodeERC721AssetData(mockAsset.erc721, tokenId)
    const erc20AssetData = assetDataUtils.encodeERC20AssetData(mockAsset.bnb)


    const chainId = 4
    const sellContract = new ZeroExchange({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })


    const order = {
      makerAddress: sellAccount,
      takerAddress: NULL_ADDRESS,
      feeRecipientAddress: NULL_ADDRESS,
      senderAddress: NULL_ADDRESS,
      makerAssetAmount: bn1,
      takerAssetAmount: bn200,
      makerFee: bn0,
      takerFee: bn0,
      expirationTimeSeconds: new BigNumber('16499305000820'),
      salt: bn1,
      takerAssetData: erc20AssetData,
      makerAssetData: erc721AssetData,
      makerFeeAssetData: '0x',
      takerFeeAssetData: '0x'
    }

    const signedOrder = await sellContract.orderSign(order)


    const buyContract = new ZeroExchange({
      chainId,
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })


    const userAccount = new Account({
      chainId,
      address: sellAccount,
      priKey: secrets.accounts[sellAccount]
    })

    const erc20bal = await userAccount.getERC20Balances(mockAsset.bnb,sellAccount)
    console.log("WETH bal",erc20bal)
    if(parseInt(erc20bal) >100e9){
      const withDraw = await userAccount.withdrawWETH(erc20bal)
      await withDraw.wait()
    }

    const allow = await userAccount.getERC721Allowance(mockAsset.erc721, sellAccount)
    const bal = await userAccount.getERC721Balances(mockAsset.erc721, tokenId.toString(), sellAccount)
    console.log('Erc721 allow', allow, bal)

    if (bal === '0') {
      console.log('Erc721 bal = 0 marketBuyOrdersWithEth fail')
      return
    }

    const tx = await buyContract.marketBuyOrdersWithEth(signedOrder)
    await tx.wait()
    console.log('ok', tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
