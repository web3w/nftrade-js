import { NULL_ADDRESS, BigNumber, ethers } from 'web3-wallets'
import { Asset } from 'web3-accounts'

export function feeSalt(royaltyFee: number, royaltyAddress: string): BigNumber {
  if (royaltyFee > 1000) {
    // throw 'Fee cannot exceed 10%'
  }

  // saltType (16bit) + nonce(32bit) + timeNow(32bit) + feePercent(16bit) + address(160bit) = 256bit
  const nowMS = parseInt(String((new Date()).getTime() / 1000))
  const typeHex = ethers.utils.hexZeroPad({ length: 1, '0': 1 }, 2)
  const nonceHex = ethers.utils.hexZeroPad({ length: 1, '0': 0 }, 4)
  const timeMS = ethers.utils.arrayify(nowMS)
  const timeHex = ethers.utils.hexZeroPad(timeMS, 4)
  const feePct = ethers.utils.arrayify(royaltyFee)
  const feePctHex = ethers.utils.hexZeroPad(feePct, 2)


  const saltHex = ethers.utils.hexConcat([typeHex, nonceHex, timeHex, feePctHex, royaltyAddress])

  // const saltBnStr = ethers.BigNumber.from(saltHex).toString()
  // const salt = new BigNumber(saltStr)

  // const expirationTimeSeconds = expirationTime ? new BigNumber(expirationTime) : new BigNumber(nowMS).plus(7 * 24 * 60 * 60)
  return new BigNumber(saltHex, 16)

}

export const rateUtils = {

  computerFeeSalt(makerAsset: Asset, assetAmount: BigNumber, feeRate: number) {
    const royaltyFeeBasisPoints = makerAsset.collection?.royaltyFeePoints || 0
    const royaltyAddress = makerAsset.collection?.royaltyFeeAddress
    const protocolFeePoints = feeRate
    const protocolFee = assetAmount.times(protocolFeePoints).div(10000)
    let royaltyFee = new BigNumber(0)
    let salt = feeSalt(0, NULL_ADDRESS)

    let tokenAmount = assetAmount.minus(protocolFee)
    if (royaltyFeeBasisPoints > 0) {
      if (royaltyAddress) {
        // const royaltyPtc= new BigNumber(5000000).div(750).toFixed(0,1);
        // debugger
        const allFee = new BigNumber(protocolFeePoints).plus(royaltyFeeBasisPoints)
        // console.log('royaltyPtc', royaltyFeeBasisPoints, allFee.toString())
        const royaltyPtc = new BigNumber(royaltyFeeBasisPoints).times(10000).div(allFee).toFixed(0, 1)
        // console.log('royaltyPtc', royaltyPtc)
        salt = feeSalt(Number(royaltyPtc), royaltyAddress)
      } else {
        throw `Royalty fee is ${royaltyFeeBasisPoints} but fee reciptient address is null`
      }
      //BOUNTY 版权费
      royaltyFee = protocolFee.plus(assetAmount.times(royaltyFeeBasisPoints).div(10000))
      tokenAmount = assetAmount.minus(royaltyFee)
    } else {
      royaltyFee = protocolFee
    }


    return {
      royaltyFee,
      tokenAmount,
      salt,
      protocolFeePoints
    }
  },

  computerFee(makerAsset: Asset, assetAmount: BigNumber, feeRate: number) {
    const royaltyFeeBasisPoints = makerAsset.collection?.royaltyFeePoints || 0
    const protocolFee = assetAmount.times(feeRate).div(10000)
    let royaltyFee = new BigNumber(0)
    let feeRecipientAddress = NULL_ADDRESS//constants.FEE_RECIPIENT_ADDRESS

    let tokenAmount = assetAmount.minus(protocolFee)
    if (royaltyFeeBasisPoints > 0) {
      //BOUNTY 版权费
      royaltyFee = protocolFee.plus(assetAmount.times(royaltyFeeBasisPoints).div(10000))
      tokenAmount = assetAmount.minus(royaltyFee)
    } else {
      royaltyFee = protocolFee
    }

    return {
      royaltyFee,
      tokenAmount,
      feeRecipientAddress
    }
  },


  computerFeeRoyalt(makerAsset: Asset, assetAmount: BigNumber) {
    const royaltyFeeBasisPoints = makerAsset.collection?.royaltyFeePoints || 0
    let royaltyFee = new BigNumber(0)
    let feeRecipientAddress = NULL_ADDRESS //constants.FEE_RECIPIENT_ADDRESS

    let tokenAmount = assetAmount
    if (royaltyFeeBasisPoints > 0) {
      //BOUNTY 版权费
      royaltyFee = assetAmount.times(royaltyFeeBasisPoints).div(10000)
      if (makerAsset.collection?.royaltyFeeAddress) {
        feeRecipientAddress = makerAsset.collection.royaltyFeeAddress
      } else {
        throw `Royalty fee is ${royaltyFeeBasisPoints} but fee reciptient address is null`
      }
      // takerFeeAssetData = takerAssetData
      tokenAmount = assetAmount.minus(royaltyFee)
    }

    return {
      royaltyFee,
      tokenAmount,
      feeRecipientAddress
    }
  }
}
