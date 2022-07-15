import {
    BaseOrder, CreateOrderOpts, DealOrder, MakerOrderParams, OrderMainInfo, APIConfig,
    Asset,
    BigNumber,
    BuyOrderParams,
    CreateOrderParams,
    EIP712Domain,
    getProvider,
    LimitedCallSpec,
    OrderSide,
    SellOrderParams,
    Token,
    transactionToCallData,
    Web3Accounts,
    WalletInfo,
    hexUtils,
    getEIP712DomainHash,
    createEIP712TypedData,
    EIP712TypedData,
    NULL_ADDRESS, OrderStatus, Order
} from '../types'
import {Contract, ethers, Signer} from 'ethers'
import EventEmitter from 'events'
import {ZEROEX_V3_CONTRACTS_ADDRESSES, ZeroV3ContractsAddresses, ContractABI} from './config'


import {orderFactory} from '../utils/order_factory'
import {rateUtils} from '../utils/rate_utils'
import {constants} from '../utils/constants'
import {generatePseudoRandomSalt} from '../utils/salt'

export {EXSWAP_CONTRACTS_ADDRESSES, ContractABI} from './config'


export class ZeroExContract extends EventEmitter {
    public chainId: number
    public walletInfo: WalletInfo
    public protocolFeePoints: number
    public protocolFeeAddress: string
    public contractAddresses: ZeroV3ContractsAddresses
    public exchange: Contract
    public forwarderEx: Contract
    public userAccount: Web3Accounts

    public readonly signer: Signer
    public readonly signerAddress: string
    public readonly walletProvider: any
    public GasWarpperToken: Token
    public eip712DomainName = '0x Protocol'
    public eip712DomainVersion = '1.0.0'

    constructor(wallet: WalletInfo, config?: APIConfig) {
        super()
        const {address, chainId, walletSigner, walletProvider} = getProvider(wallet)
        this.chainId = chainId
        this.signer = walletSigner
        this.walletProvider = walletProvider
        this.signerAddress = address
        this.walletInfo = wallet
        wallet.isSetGasPrice = true
        this.userAccount = new Web3Accounts(wallet)
        const {protocolFeePoints, contractAddresses, protocolFeeAddress} = config || {}
        this.contractAddresses = contractAddresses || ZEROEX_V3_CONTRACTS_ADDRESSES[chainId]
        if (!this.contractAddresses) throw 'Contracts address not defined'
        this.protocolFeePoints = protocolFeePoints || 0
        this.protocolFeeAddress = protocolFeeAddress || this.contractAddresses.FeeDispatcher

        if (!this.contractAddresses) {
            throw 'Get contracts addresses error'
        }
        this.exchange = new ethers.Contract(this.contractAddresses.Exchange, ContractABI.exchange.abi, this.signer)
        this.forwarderEx = new ethers.Contract(this.contractAddresses.ForwarderEx, ContractABI.forwarder.abi, this.signer)

        this.GasWarpperToken = {
            name: 'GasToken',
            symbol: 'GasToken',
            address: this.contractAddresses.GasToken.toLowerCase(),
            decimals: 18
        }
    }

    // async setBestRPC() {
    //   this.walletInfo.rpcUrl = await getChainRpcUrl(this.walletInfo.chainId)
    // }

    // getOrderHash(order: SignedOrder) {
    //   const baseOrder: Order = orderFactory.converOrder(order)
    //   return orderHashUtils.getOrderHash(baseOrder)
    // }

    async getOrderInfo(order: BaseOrder) {
        const data = orderFactory.converStrOrder(order)
        const orderInfo = await this.exchange.getOrderInfo(data)
        const orderStatus = orderInfo.orderStatus
        const orderStatusIsFillable = orderStatus === OrderStatus.Fillable
        console.assert(orderStatusIsFillable, 'orderStatus not FILLABLE')
        if (!orderStatusIsFillable) {
            console.log(orderInfo)
            console.error(`orderStatus ${orderStatus} error`)
            // throw `orderStatus ${orderStatus} error`
        }
        const orderHash = orderInfo.orderHash

        return {orderHash, data, orderStatusIsFillable, orderStatus}
    }

    // async orderHashSign(order: BaseOrder) {
    //   const { orderHash, data } = await this.getOrderInfo(order)
    //   const signerAddr = this.signerAddress.toLowerCase()
    //   const signature = await signatureUtils.ecSignHashByPersonal(this.walletProvider, orderHash, signerAddr)
    //   console.log('orderHashSign signature', signature)
    //   const isValidHashSignature = await this.exchange.isValidHashSignature(orderHash, signerAddr, signature)
    //   console.log('isValidHashSignature', isValidHashSignature)
    //   console.assert(isValidHashSignature, 'isValidHashSignature false')
    //   return { signature, orderHash, data }
    // }

    private async signedOrder(orderInfo: OrderMainInfo, orderOpts: CreateOrderOpts): Promise<DealOrder> {
        const {
            makerAddress,
            makerAssetAmount,
            makerAssetData,
            takerAssetAmount,
            takerAssetData,
            exchangeAddress
        } = orderInfo

        const defaultCreateOrderOpts = {
            takerAddress: NULL_ADDRESS,
            senderAddress: NULL_ADDRESS,
            makerFee: '0',
            takerFee: '0',
            feeRecipientAddress: NULL_ADDRESS,
            salt: generatePseudoRandomSalt().toString(),
            expirationTimeSeconds: constants.DefaultExpirationTimeSeconds
        }
        const expirationTimeSeconds = orderOpts.expirationTimeSeconds || defaultCreateOrderOpts.expirationTimeSeconds || constants.DefaultExpirationTimeSeconds
        const order = {
            makerAddress,
            makerAssetAmount: makerAssetAmount.toString(),
            takerAssetAmount: takerAssetAmount.toString(),
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: orderOpts.makerFeeAssetData || makerAssetData,
            takerFeeAssetData: orderOpts.takerFeeAssetData || takerAssetData,
            takerAddress: orderOpts.takerAddress || defaultCreateOrderOpts.takerAddress,
            senderAddress: orderOpts.senderAddress || defaultCreateOrderOpts.senderAddress,
            makerFee: orderOpts?.makerFee?.toString() || defaultCreateOrderOpts.makerFee,
            takerFee: orderOpts?.takerFee?.toString() || defaultCreateOrderOpts.takerFee,
            feeRecipientAddress: orderOpts.feeRecipientAddress || defaultCreateOrderOpts.feeRecipientAddress || constants.FeeRecipientAddress,
            salt: orderOpts?.salt?.toString() || defaultCreateOrderOpts.salt || '0',
            expirationTimeSeconds,
            exchangeAddress,
            chainId: this.walletInfo.chainId
        }
        order.feeRecipientAddress = this.protocolFeeAddress
        // order.salt= "1"
        // order.expirationTimeSeconds= "1654449920"

        const domain = {
            name: this.eip712DomainName,
            version: this.eip712DomainVersion,
            chainId: this.walletInfo.chainId,
            verifyingContract: order.exchangeAddress
        } as EIP712Domain

        const domainHash = await this.exchange.EIP712_EXCHANGE_DOMAIN_HASH()
        const hash = getEIP712DomainHash(domain)

        console.assert(domainHash == hash, 'Error EIP712_EXCHANGE_DOMAIN_HASH')
        const typedData = createEIP712TypedData(
            constants.EXCHANGE_ORDER_SCHEMA.name,
            {Order: constants.EXCHANGE_ORDER_SCHEMA.parameters},
            order,
            domain
        )
        // console.log('orderHash', JSON.stringify(typedData, null, 2))
        const sign = await this.userAccount.signTypedData(typedData)
        const signVRS = ethers.utils.splitSignature(sign.signature)
        const signature = hexUtils.concat([hexUtils.toHex(signVRS.v), signVRS.r, signVRS.s, hexUtils.toShortHex(2)])
        const signedOrder = {
            ...order,
            signature
        } as DealOrder
        const {orderStatusIsFillable, orderStatus, orderHash} = await this.getOrderInfo(signedOrder)

        // console.log('orderHash', orderHash)
        const isValidHashSignature = await this.exchange.isValidHashSignature(orderHash, this.walletInfo.address, signature)
        if (!orderStatusIsFillable && !isValidHashSignature) {
            throw `Order status ${orderStatus} error`
        }
        return signedOrder
    }

    async createSellOrder(sellParams: SellOrderParams): Promise<DealOrder> {
        const {
            asset,
            quantity = 1,
            paymentToken = this.GasWarpperToken,
            expirationTime = 0,
            startAmount = 0,
            buyerAddress
        } = sellParams
        const params: CreateOrderParams = {
            asset,
            startAmount,
            paymentToken,
            expirationTime,
            quantity
        }

        let takerAssetAmount = new BigNumber(0)
        if (startAmount > 0) {
            // 在这里控制单价还是总价,element-js就是总价
            takerAssetAmount = new BigNumber(startAmount).times(new BigNumber(10).pow(paymentToken.decimals))
            // takerAssetAmount = new BigNumber(startAmount).times(quantity).times(new BigNumber(10).pow(paymentToken.decimals))
        }
        const makerAssetAmount = new BigNumber(quantity)

        const approveInfo = await this.getOrderApproveStep(params, OrderSide.Sell)

        if (makerAssetAmount.gt(approveInfo.balances)) {
            throw 'Seller nft insufficient'
        }
        if (!approveInfo.isApprove) {
            const tx = await this.ethSend(approveInfo.calldata)
            await tx.wait()
            console.log('Seller approve nft')
        }

        //------ makerSignedSellOrder  -------------
        if (makerAssetAmount.isZero() || takerAssetAmount.isZero()) {
            throw 'Incorrect order amount'
        }

        const makerParams: MakerOrderParams = {
            makerAsset: asset,
            makerAssetAmount,
            takerToken: paymentToken,
            takerAssetAmount,
            expirationTime,
            protocolFeePoints: this.protocolFeePoints,
            buyerAddress
        }
        const {orderOpts, assetInfo} = orderFactory.makerSellOrder(makerParams)
        const orderInfo: OrderMainInfo = {
            ...assetInfo,
            makerAssetAmount: assetInfo.makerAssetAmount.toString(),
            takerAssetAmount: assetInfo.makerAssetAmount.toString(),
            makerAddress: this.signerAddress,
            exchangeAddress: this.exchange.address
        }
        return this.signedOrder(orderInfo, orderOpts)
    }

    async createBuyOrder(buyParams: BuyOrderParams): Promise<DealOrder> {
        const {
            asset,
            quantity = 1,
            paymentToken = this.GasWarpperToken,
            expirationTime = 0,
            startAmount
        } = buyParams
        const params: CreateOrderParams = {
            asset,
            startAmount,
            expirationTime,
            paymentToken,
            quantity
        }
        const takerAssetAmount = new BigNumber(quantity)
        let makerAssetAmount = new BigNumber(0)
        if (startAmount > 0) {
            // 在这里控制单价还是总价
            makerAssetAmount = new BigNumber(startAmount).times(new BigNumber(10).pow(paymentToken.decimals))
            // makerAssetAmount = new BigNumber(startAmount).times(quantity).times(new BigNumber(10).pow(paymentToken.decimals))
        }
        const approveInfo = await this.getOrderApproveStep(params, OrderSide.Buy)
        if (makerAssetAmount.gt(approveInfo.balances)) {
            throw 'Buyer erc20 insufficient'
        }
        if (!approveInfo.isApprove) {
            const tx = await this.ethSend(approveInfo.calldata)
            await tx.wait()
            console.log('Buyer approve erc20')
        }

        //------ makerSignedBuyOrder  -------------
        if (makerAssetAmount.isZero() || takerAssetAmount.isZero()) {
            throw 'Incorrect order amount'
        }

        const makerParams: MakerOrderParams = {
            makerAsset: asset,
            makerAssetAmount,
            takerToken: paymentToken,
            takerAssetAmount,
            expirationTime,
            protocolFeePoints: this.protocolFeePoints
        }
        const {orderOpts, assetInfo} = orderFactory.makerBuyOrder(makerParams)
        const orderInfo: OrderMainInfo = {
            ...assetInfo,
            makerAssetAmount: assetInfo.makerAssetAmount.toString(),
            takerAssetAmount: assetInfo.makerAssetAmount.toString(),
            makerAddress: this.signerAddress,
            exchangeAddress: this.exchange.address
        }
        return this.signedOrder(orderInfo, orderOpts)
    }

    async createLowerPriceOrder(orderStr: string, parameter: { basePrice: string, makerAsset: Asset }): Promise<DealOrder> {
        const {basePrice, makerAsset} = parameter
        const newPrice = basePrice.toString()
        const oldOrder = JSON.parse(orderStr)
        const {makerAddress, takerAddress, feeRecipientAddress, senderAddress} = oldOrder
        const {makerAssetData, makerAssetAmount, takerAssetData, takerAssetAmount} = oldOrder
        const {makerFee, makerFeeAssetData, takerFee, takerFeeAssetData} = oldOrder
        const {expirationTimeSeconds, chainId, exchangeAddress} = oldOrder

        const {
            royaltyFee,
            salt,
            tokenAmount,
            protocolFeePoints
        } = rateUtils.computerFeeSalt(makerAsset, new BigNumber(basePrice), this.protocolFeePoints)


        const orderOpts = {
            takerAddress,
            senderAddress,
            salt,
            makerFee,
            takerFee,
            expirationTimeSeconds: expirationTimeSeconds.toString(),
            feeRecipientAddress,
            takerFeeAssetData,
            makerFeeAssetData
        }
        const orderInfo: OrderMainInfo = {
            makerAssetAmount,
            makerAssetData,
            takerAssetAmount,
            takerAssetData,
            makerAddress,
            exchangeAddress
        }

        const makerData = orderFactory.getAssetData(makerAssetData, makerAssetAmount.toString())
        const takerData = orderFactory.getAssetData(takerAssetData, takerAssetAmount.toString())

        // 买NFT
        if (makerData.contract.standards[0] == 'ERC20') {
            console.log('LowerPrice Sell Nft by ERC20')
            if (new BigNumber(makerAssetAmount).times(0.5).gt(newPrice)) {
                // throw 'new price invalid'
            }
            // const rate = new BigNumber(makerFee).div(new BigNumber(makerAssetAmount).plus(makerFee))
            if (royaltyFee.isZero()) {
                orderInfo.makerAssetAmount = new BigNumber(newPrice).toString()
            } else {
                orderOpts.makerFee = royaltyFee  //new BigNumber(newPrice).times(rate)
                orderInfo.makerAssetAmount = tokenAmount.toString()  //new BigNumber(newPrice).minus(orderOpts.makerFee)
                console.assert(new BigNumber(basePrice).eq(orderInfo.makerAssetAmount), 'makerAssetAmount calculate error')
                const rate = new BigNumber(makerAsset?.collection?.royaltyFeePoints || 0).plus(protocolFeePoints).div(10000)
                console.assert(orderOpts.makerFee.div(basePrice.toString()).eq(rate), 'maker fee calculate error')
            }
        }
        // 卖NFT
        if (takerData.contract.standards[0] == 'ERC20') {
            console.log('LowerPrice Buy NFT by ERC20 ')
            if (new BigNumber(takerAssetAmount).times(0.5).gt(newPrice)) {
                // throw 'new price invalid'
            }
            // const rate = new BigNumber(takerFee).div(new BigNumber(takerAssetAmount).plus(takerFee))
            if (royaltyFee.isZero()) {
                orderInfo.takerAssetAmount = new BigNumber(newPrice).toString()
            } else {
                orderOpts.takerFee = royaltyFee //new BigNumber(newPrice).times(rate)
                orderInfo.takerAssetAmount = tokenAmount.toString() //new BigNumber(newPrice).minus(orderOpts.takerFee)

                console.assert(new BigNumber(basePrice).eq(new BigNumber(orderInfo.takerAssetAmount).plus(orderOpts.takerFee.toString())), 'takerAssetAmount calculate error')
                const rate = new BigNumber(makerAsset?.collection?.royaltyFeePoints || 0).plus(protocolFeePoints).div(10000)
                console.assert(orderOpts.takerFee.div(basePrice.toString()).eq(rate), 'taker fee calculate error')
            }
        }
        return this.signedOrder(orderInfo, orderOpts as CreateOrderOpts)
    }


    async getOrderApproveStep(
        params: CreateOrderParams,
        side: OrderSide
    ): Promise<any> {
        const asset = params.asset
        const paymentToken = params.paymentToken || this.GasWarpperToken
        const quantity = new BigNumber(params.quantity || 1)
        if (paymentToken.address == NULL_ADDRESS) {
            throw 'PaymentToken can\'t  NULL_ADDRESS'
        }
        if (asset.schemaName.toLowerCase() == 'erc721' && !quantity.eq(1)) {
            throw 'ERC721 quantity must eq 1'
        }

        if (side == OrderSide.Sell) { // 检查 Sell 卖单
            const operator = this.getProxyAddress('erc20')
            return this.userAccount.getAssetApprove(asset, operator)
        } else if (side == OrderSide.Buy) { // 检查 Buy Params
            const spender = this.getProxyAddress('erc20')
            const basePrice = new BigNumber(params.startAmount).times(new BigNumber(10).pow(paymentToken.decimals))
            const {
                allowance,
                balances,
                calldata
            } = await this.userAccount.getTokenApprove(paymentToken.address, spender)
            return {
                isApprove: basePrice.lte(allowance),
                calldata,
                balances
            }
        } else {
            throw 'undefind order type'
        }
    }

    public getOrderTypeData(order: DealOrder) {
        order = orderFactory.converStrOrder(order)
        const makerData: Asset = orderFactory.getAsset(order.makerAssetData)
        const makerAmount: string = order.makerAssetAmount.toString()
        const takerData: Asset = orderFactory.getAsset(order.takerAssetData)
        const takerAmount: string = order.takerAssetAmount.toString()

        let orderType: OrderSide
        let erc20Data: Asset
        let erc20Amount: string
        let nftData: Asset
        let nftAmount: string
        // fillorder为 买Nft单 checkBuyOrder
        if (makerData.schemaName.toLowerCase() == 'erc20') {
            orderType = OrderSide.Buy
            erc20Data = makerData
            erc20Amount = makerAmount
            nftData = takerData
            nftAmount = takerAmount
        } else if (takerData.schemaName.toLowerCase() == 'erc20') { //Order为NFT Sell单 checkSellOrder
            orderType = OrderSide.Sell
            erc20Data = takerData
            erc20Amount = takerAmount
            nftData = makerData
            nftAmount = makerAmount
        } else {
            throw 'Get order type data failed'
        }

        return {
            order,
            signature: order.signature,
            orderType,
            erc20Data,
            erc20Amount,
            nftData,
            nftAmount,
            makerData,
            makerAmount,
            takerData,
            takerAmount
        }
    }

    private async checkBuyOrder(order: DealOrder, takerAmount?: string) {
        const {erc20Data, erc20Amount, nftData, nftAmount} = this.getOrderTypeData(order)
        // const erc20Data = orderFactory.getAsset(order.makerAssetData)
        // const erc20Amount = order.makerAssetAmount
        // const nftData = orderFactory.getAsset(order.takerAssetData)
        // const nftAmount = order.takerAssetAmount
        if (erc20Data.schemaName !== 'erc20') throw 'CheckBuyOrder erc20 type error'
        const feeTokenAddress = erc20Data.tokenAddress
        const maker = order.makerAddress

        takerAmount = takerAmount || nftAmount

        const erc20Operator = this.getProxyAddress(erc20Data.schemaName)
        // 检查买方的 ERC 20
        const erc20Aprove = await this.userAccount.getTokenApprove(feeTokenAddress, erc20Operator, maker)

        // 获取taker amount
        const paymentAmount = new BigNumber(erc20Amount).div(nftAmount).times(takerAmount)
        if (paymentAmount.gt(erc20Aprove.balances)) throw 'Buyer\'s erc20 not enough' + nftAmount + ',' + paymentAmount.toString()
        if (paymentAmount.gt(erc20Aprove.allowance)) throw 'Buyer\'s erc20 need approve'


        // 检查卖方的 nft
        const nftOperator = this.getProxyAddress(nftData.schemaName)
        const nftApprove = await this.userAccount.getAssetApprove(nftData, nftOperator)
        if (new BigNumber(takerAmount).gt(nftApprove.balances)) throw 'Seller nft not enough'


        if (!nftApprove.isApprove && nftApprove.calldata) {
            const allowTx = await this.ethSend(nftApprove.calldata)
            await allowTx.wait()
            console.log('Seller nft approve')
        }
    }

    private async checkSellOrder(order: DealOrder, takerAmount?: string) {
        // const erc20Data = orderFactory.getAsset(order.takerAssetData)
        // if (erc20Data.schemaName !== TokenSchemaName.ERC20) throw 'CheckSellOrder erc20 type error'
        // const erc20Amount = order.takerAssetAmount
        // const nftData = orderFactory.getAsset(order.makerAssetData)
        // const nftAmount = order.makerAssetAmount
        const {erc20Data, erc20Amount, nftData, nftAmount} = this.getOrderTypeData(order)
        if (erc20Data.schemaName.toLowerCase() !== 'erc20') throw 'CheckSellOrder erc20 type error'

        const maker = order.makerAddress
        if (takerAmount && new BigNumber(takerAmount).gt(nftAmount)) console.warn('SellOrder\'s nft not enough to taker amount')

        takerAmount = takerAmount || nftAmount

        // console.log(takerAmount.toString())
        // 检查卖方的 nft
        const nftOperator = this.getProxyAddress(nftData.schemaName)
        //  const operator = await this.exchange.getAssetProxy('0x02571792')
        const userNft = await this.userAccount.getAssetApprove(nftData, nftOperator, maker)
        if (!userNft.isApprove) throw 'SellOrder\'s nft need approve'
        if (new BigNumber(nftAmount).gt(userNft.balances)) throw 'SellOrder\'s nft not enough'

        // 检查买方资产 买方的 erc20
        const feeTokenAddress = erc20Data.tokenAddress.toLowerCase()
        if (feeTokenAddress !== this.GasWarpperToken.address) {
            const erc20Operator = this.getProxyAddress(erc20Data.schemaName)
            const userErc20 = await this.userAccount.getTokenApprove(feeTokenAddress, erc20Operator)

            const paymentAmount = new BigNumber(erc20Amount).div(nftAmount).times(takerAmount)
            if (paymentAmount.gt(userErc20.balances)) {
                throw 'Buyer\'s erc20 not enough' + order.makerAssetAmount.toString() + ',' + nftAmount.toString()
            }

            if (new BigNumber(erc20Amount).gt(userErc20.allowance)) {
                const allowTx = await this.ethSend(userErc20.calldata)
                await allowTx.wait()
                console.log('Buyer\'s erc20 allowance')
            }
        }
    }

    public async checkMatchOrder(order: DealOrder, takerAmount?: string) {
        const {
            makerData,
            makerAmount,
            takerData,
            erc20Data,
            orderType,
            nftAmount,
            signature
        } = this.getOrderTypeData(order)
        const baseOrder = orderFactory.converBaseOrder(order)
        if (takerAmount && new BigNumber(takerAmount).gt(nftAmount)) {
            console.warn(`TakerAmount greater then order nft amount ${takerAmount} >${nftAmount}`)
        }
        // Order为 买Nft单
        if (orderType == OrderSide.Buy) {
            await this.checkBuyOrder(order, takerAmount)
        }
        // Order为NFT Sell单
        if (orderType == OrderSide.Sell) {
            await this.checkSellOrder(order, takerAmount)
        }
        return {makerData, makerAmount, takerData, erc20Data, orderType, baseOrder, signature}
    }

    protected async batchOrder(orders: DealOrder[], nftAmounts?: string[]) {
        let signatures: string [] = []
        let orderAmounts: string[] = []
        let orderAll: DealOrder[] = []
        let values = new BigNumber(0)
        let makerAmounts = new BigNumber(0)
        for (let i = 0; i < orders.length; i++) {
            const {order, signature, orderType, erc20Data, takerData, nftAmount} = this.getOrderTypeData(orders[i])
            // const { signature,data } = await this.check712Sign(order)

            let takerAmount = new BigNumber(order.takerAssetAmount)
            // const takerData = orderFactory.getAsset(order.takerAssetData)
            const makerBuyAmount = nftAmounts ? nftAmounts[i] : nftAmount

            await this.checkMatchOrder(order, makerBuyAmount)

            // orders 为买单
            if (orderType == OrderSide.Sell && takerData.schemaName.toLowerCase() == 'erc20') {
                // takerAmount = order.takerFee.plus(takerAmount)
                if (makerBuyAmount) {
                    if (new BigNumber(makerBuyAmount).gt(order.makerAssetAmount)) console.warn('batchOrder: makerBuyAmount>order.makerAssetAmount')
                    // ETH
                    const value = takerAmount.plus(order.takerFee).div(order.makerAssetAmount).times(makerBuyAmount)
                    values = values.plus(value)
                    takerAmount = takerAmount.div(order.makerAssetAmount).times(makerBuyAmount)
                    // ETH
                    // console.log(`takerAmount ${takerAmount} values ${values} takerFee ${order.takerFee} all ${takerAmount.plus(order.takerFee)} makerBuyAmount  ${makerBuyAmount}`)
                } else {
                    const value = takerAmount.plus(order.takerFee)
                    values = values.plus(value)
                }
            } else {
                if (makerBuyAmount) {
                    takerAmount = new BigNumber(makerBuyAmount)
                }
            }
            orderAll.push(order)
            orderAmounts.push(takerAmount.integerValue(BigNumber.ROUND_CEIL).toString())
            makerAmounts = makerAmounts.plus(makerBuyAmount)
            signatures.push(signature)
        }

        return {
            orderAll,
            orderAmounts,
            signatures,
            value: values.integerValue(BigNumber.ROUND_CEIL).toString(),
            makerAssetBuyAmount: makerAmounts.integerValue(BigNumber.ROUND_CEIL).toString()
        }
    }


    // ------------------ Zero Ex  --------------------------

    public async cancelOrderCallData(
        order: DealOrder
    ): Promise<LimitedCallSpec> {
        const data = orderFactory.converBaseOrder(order)
        // const beforeIsCanceled1 = await this.exchange.cancelled('0x8c96d2eb5e68c27e6dd13f4c11b656105b596b6035ea1d7c04a4cea6f7e3c7b5')

        // const { isValidOrderSignature, data } = await this.check712Sign(order)
        // const { orderHash, orderStatus } = await this.getOrderInfo(order)
        // if (!isValidOrderSignature || orderStatus == 6 || orderStatus == 5) {//OrderStatus.Cancelled =6 OrderStatus.FullyFilled = 5
        //   throw 'cancelledOrFinalized'
        // }
        const callData = await this.exchange.populateTransaction.cancelOrder(data)
        return transactionToCallData(callData)
    }


    public async cancelOrder(
        order: DealOrder
    ): Promise<any> {
        const callData = await this.cancelOrderCallData(order)
        // callData.from = order.makerAddress
        return this.ethSend(callData)
        // return this.changeState(callData)
    }

    async ethSend(callData: LimitedCallSpec) {
        return this.userAccount.ethSend(callData)
    }

    async estimateGas(callData: LimitedCallSpec) {
        return this.userAccount.estimateGas(callData)
    }

    public getProxyAddress(type: string): string {
        // const operator = this.elementixTokenTransferProxy
        if (type.toLowerCase() == 'erc721') {
            return this.contractAddresses.ERC721Proxy
        } else if (type.toLowerCase() == 'erc1155') {
            return this.contractAddresses.ERC1155Proxy
        } else if (type.toLowerCase() == 'erc20') {
            return this.contractAddresses.ERC20Proxy
        } else {
            throw  'not defind asset type'
        }
    }
}

