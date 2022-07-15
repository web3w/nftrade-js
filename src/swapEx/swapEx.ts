import EventEmitter from 'events'
import {Contract, ethers} from 'ethers'
import {
    EXSWAP_CONTRACTS_ADDRESSES,
    ContractABI
} from '../contracts'


import {ZeroExV3} from '../zeroExV3'
import {
    ethSend, LimitedCallSpec,
    WalletInfo, getEstimateGas, Web3Accounts, CHAIN_CONFIG, getChainRpcUrl, DealOrder, transactionToCallData
} from '../types'
import {NFTradeSDK} from "../nftradeSdk";

export interface SimpleTrades {
    value: string
    tradeData: string
}

export interface TradeDetails extends SimpleTrades {
    marketId: string
}

function getValidSwaps(intData: number, swaps: Array<TradeDetails>) {
    let bData = intData.toString(2)

    if (bData.length != swaps.length) {
        const diffLen = swaps.length - bData.length
        if (bData.length > 200) throw 'GetValidSwaps error'
        const b0 = Array(diffLen).fill(0).join('')
        bData = `${b0}${bData}`
    }
    let allValue = ethers.BigNumber.from(0)
    let swapValid: Array<TradeDetails> = []
    const swapIsValid = swaps.map((val, index) => {
        const isValid = bData[swaps.length - index - 1] == '1' ? true : false
        if (isValid) {
            allValue = allValue.add(val.value)
            swapValid.push(val)
        }
        return {
            index,
            isValid,
            swap: val
        }
    })
    return {swapIsValid, swaps: swapValid, value: allValue.toString(), bData}
}

function getSwapsValue(swaps: Array<TradeDetails>) {
    let value = ethers.BigNumber.from(0)
    swaps.forEach(val => {
        value = value.add(val.value)
    })
    return value
}

export class SwapEx extends EventEmitter {
    public swapExContract: Contract
    public zeroExV3Contract: Contract | undefined
    public walletInfo: WalletInfo
    public userAccount: Web3Accounts
    public contractAddr

    constructor(wallet: WalletInfo) {
        super()
        this.walletInfo = {...{rpcUrl: CHAIN_CONFIG[wallet.chainId].rpcs[0]}, ...wallet}
        this.userAccount = new Web3Accounts(wallet)
        const contractAddr = EXSWAP_CONTRACTS_ADDRESSES[this.walletInfo.chainId]
        if (!contractAddr) throw 'ElementExSwap config error ' + this.walletInfo.chainId
        this.swapExContract = new ethers.Contract(contractAddr.ExSwap, ContractABI.swapEx.abi, this.userAccount.signer)
        if (contractAddr[1]) {
            this.zeroExV3Contract = new ethers.Contract(contractAddr[1], ContractABI.zeroExV3.abi, this.userAccount.signer)
        }

        this.contractAddr = contractAddr
    }

    public async batchBuyWithETHSimulate(swaps: Array<TradeDetails>): Promise<any> {
        if (swaps.length == 0) return {swaps: [], value: '0'}// throw 'BatchBuyWithETHSimulate swaps is null'
        // if (swaps.find(val => !val.tradeData) || swaps.find(val => !val.value)) throw 'BatchBuyWithETHSimulate swaps tradeData or value is undefined'
        for (const val of swaps) {
            if (!val.tradeData || !val.value) throw 'BatchBuyWithETHSimulate swaps tradeData or value is undefined'
            const funcID = val.tradeData.substring(0, 10)
            console.log('Market ID:', val.marketId, funcID)
            // if (this.walletInfo.chainId == 1 || this.walletInfo.chainId == 4) {
            //   //markId 0 opensea 0xab834bab atomicMatch_(address[14],uint256[18],uint8[8],bytes,bytes,bytes,bytes,bytes,bytes,uint8[2],bytes32[5])
            //   if (val.marketId == '0' && funcID != '0xab834bab') throw 'OpenseaExV2 match function encode error'
            //
            //   //markId 1 element 0x9d6c2062 orderMatch(DataType.Order memory buy, DataType.Sig memory buySig, DataType.Order memory sell, DataType.Sig memory sellSig, bytes32 metadata)
            //   if (val.marketId == '1' && funcID != '0x9d6c2062') throw 'ElementExV1 match function encode error'
            // } else if (this.walletInfo.chainId == 56 || this.walletInfo.chainId == 97) {
            //   // if (val.marketId == '0' && funcID != '0xab834bab') throw 'ElementExV3 match function encode error'
            //   if (val.marketId == '1' && funcID != '0x9e832315') throw 'ZeroExV3 match function encode error'
            // }
        }
        const value = getSwapsValue(swaps)
        return new Promise(async (resolve, reject) => {
            const callData = await this.swapExContract.populateTransaction.batchBuyWithETHSimulate(swaps, {value})
            const rpcUrl = this.walletInfo.rpcUrl?.url || await getChainRpcUrl(this.walletInfo.chainId)
            return getEstimateGas(rpcUrl, {
                ...callData,
                value: value.toString()
            } as LimitedCallSpec).catch(async (err: any) => {
                if (err.code == '-32000') {
                    console.log(value.toString())
                    const bal = await this.userAccount.getGasBalances({})
                    console.log(bal)
                    reject(err.message)
                } else {
                    //0x4e487b71
                    if (err.data.substring(0, 10) == '0x4e487b71') {
                        console.log('Panic(uint256)', err.data)
                        throw 'BatchBuyWithETHSimulate Panic'
                    }

                    const intData = parseInt(err.data, 16)
                    if (intData == 0) reject('No valid swaps data by batchBuyWithETHSimulate')
                    const swapData = getValidSwaps(intData, swaps)
                    resolve(swapData)
                }
            })
        })
    }

    public async buyNFTradeWithETH(orders: string[]) {
        const marketId = '1'
        const nftExV3 = new NFTradeSDK(this.walletInfo)
        const tradeDatas: TradeDetails[] = []
        // const market = await this.swapExContract.markets(marketId)
        // const marketProxy = market.proxy
        for (const orderStr of orders) {
            const params = {
                orderStr,
                takerAmount: '1'
            }
            const {callData} = await nftExV3.getMatchCallData(params)
            // console.log(callData.data)
            // if (callData.to.toLowerCase() != marketProxy.toLowerCase()) throw 'Market address error'
            // console.log('buyZeroV3WithETH', callData.value?.toString())
            tradeDatas.push(<TradeDetails>{
                marketId,
                'tradeData': callData.data,
                'value': callData.value
            })
        }
        return this.batchBuyWithETHSimulate(tradeDatas)

    }


    public async buyZeroV3OrdersWithETH(orders: DealOrder[]) {
        const marketId = '1'
        const zeroExV3 = new ZeroExV3(this.walletInfo)
        const callData = await zeroExV3.orderMatchCallData(orders)
        const tradeDatas: TradeDetails[] = [
            {
                marketId,
                'tradeData': callData.data,
                'value': callData.value || '0'
            }
        ]
        await this.batchBuyWithETHSimulate(tradeDatas)
        // return this.batchBuyFromSingleMarketWithETH(tradeDatas)
    }

    public async batchBuyWithETH(swaps: Array<TradeDetails>) {
        const value = getSwapsValue(swaps).toString()
        const tx = await this.swapExContract.populateTransaction.batchBuyWithETH(swaps, {value})
        // const callData = { ...tx, value: tx.value?.toString() } as LimitedCallSpec
        return ethSend(this.walletInfo, transactionToCallData(tx))

        // console.log("batchBuyWithETH", swaps.length, callData.value)
        // swaps.map(val => {
        //     console.log(val.marketId, val.value)
        // })
        //
        // return getEstimateGas(this.walletInfo.rpcUrl || "", callData)
        //

    }

}



