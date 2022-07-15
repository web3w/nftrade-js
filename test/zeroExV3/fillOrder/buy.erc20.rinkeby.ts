import { BigNumber } from '../../src/utils'
import { ethers } from 'ethers'
import { ContractBase } from '../../../src/contracts'
import secrets from '../../../../secrets.json'
import { FormatTypes } from 'ethers/lib/utils'
import { ZeroExOrder } from '../../../src/zeroExOrder'
import { ZeroExchange } from '../../../src/zeroExV3'
import { assetDataUtils, orderHashUtils } from '../../../src/order-utils'
import { Account } from '../../../src/account'


const NULL_ADDRESS = ethers.constants.AddressZero

const sellAccount = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'
const buyAccount = '0xeb1e5B96bFe534090087BEb4FB55CC3C32bF8bAA'

const tokenId = new BigNumber('3')
const bn0 = new BigNumber('0')
const bn1 = new BigNumber('1')
const bn2 = new BigNumber('2')
const bn200 = new BigNumber('200')


const mockAsset = {
    'erc20': '0xB506BFAA7661dabF4DE80672BD3f13F4610a5fDf',
    'erc721': '0x6b0d7Ed64D8faCde81B76f8eA6598808Ee93fB0b',
    'erc1155': '0x14F17a5A2c65fF8509D9F6046f4101C3CfA84328'
  }

;(async () => {
  try {
    // const wallet = new ethers.Wallet(secrets.accounts[buyAccount], provider)
    const erc721AssetData = assetDataUtils.encodeERC721AssetData(mockAsset.erc721, tokenId)
    const erc20AssetData = assetDataUtils.encodeERC20AssetData(mockAsset.erc20)


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
      expirationTimeSeconds: new BigNumber('1649930500082'),
      salt: bn0,
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
      address: buyAccount,
      priKey: secrets.accounts[buyAccount]
    })

    // const approve721Tx = await userAccount.approveErc721Proxy(mockAsset.erc721)
    // await approve721Tx.wait()


    const allow = await userAccount.getERC721Allowance(mockAsset.erc721,sellAccount)
    const bal = await userAccount.getERC721Balances(mockAsset.erc721,tokenId.toString(),sellAccount)
    console.log("Erc721 allow",allow,bal)
    if (bal === '0') {
      console.log('Erc721 bal = 0 fillOrder fail ')
      return
    }

    // const approve20Tx =await userAccount.approveErc20Proxy(mockAsset.erc20)
    // await approve20Tx.wait()
    const allowBal = await userAccount.getERC20Allowance(mockAsset.erc20,buyAccount)
    const erc20bal = await userAccount.getERC20Balances(mockAsset.erc20,buyAccount)
    console.log("Erc20 allow",allowBal,"bal",erc20bal)


    const tx = await buyContract.fillOrder(signedOrder)
    await tx.wait()
    console.log('ok',tx.hash)
  } catch (e) {
    console.log(e)
  }
})()
