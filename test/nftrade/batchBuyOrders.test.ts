import { BigNumber, ContractBase, orderHashUtils, SellOrderParams, ZeroExchange } from '../../index'
import { DealOrder } from '@txdev/0x-utils/lib'

(async () => {
  // const [deployer, maker, taker, feeRecipient, royaltyFeeRecipient] = await ethers.getSigners();
  const chainId = 56 //await deployer.getChainId();
  // hardhat
  // const sellAccount = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
  // const buyAccount = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'

  // fork
  const sellAccount = '0x25E0D5EE363473583e09cbAdE2B5bC9B6657b87A'
  const buyAccount = '0xfC890bDa1ec1C91751eB6099fEa2059453213d7b'

  const mockAsset = {
    ERC20Asset: '0x1Ba5baB5FED7D7F22C1986c5Ce7403698f1fD4f0',
    ERC721Asset: '0x3fb6C08B915877597B022008e485D1Ac29a1032b',
    ERC1155Asset: '0xbc4302c539Dc5C978c35A12F7500D888B9Ae17e4'
  }

  const config = {
    chainId,
    'contractAddresses': {
      'ElementEx': '0x0f63A418E37988b1D9B427756d250Ebe9c312f75',
      'Exchange': '0xcfb6ee27d82beb1b0f3ad501b968f01cd7cc5961',
      'ERC20Proxy': '0xE05D2BAA855C3dBA7b4762D2f02E9012Fb5F3867',
      'ERC721Proxy': '0x2559Be60A7040D645D263cA54c936320f90be74b',
      'ERC1155Proxy': '0x295f911ccb8C771593375a4e8969A124bad725d8',
      'ForwarderEx': '0xc28f1550160478a7fb3b085f25d4b179e08e649a',
      'FeeDispatcher': '0x0000000000000000000000000000000000000000',
      'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
      'GasToken': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    }
  }

  const royaltyAddr = '0x8131023E40626b26d2E2F921b420f0a8Da21c972'
  //priKey:"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  const sellContract = new ZeroExchange({
    chainId,
    address: sellAccount,
    rpcUrl: 'http://127.0.0.1:8545/'
    // address: maker.address,
    // signer: maker,
  }, config)


  console.log(sellContract.chainId)
  console.log(await sellContract.signer.getAddress())
  // console.log(await sellContract.walletProvider.listAccounts())
  // console.log(await sellContract.walletProvider.getSigner())
  const collection = {
    royaltyFeePoints: 200,
    royaltyFeeAddress: royaltyAddr
  }
  const tokenId = '12'
  const tokenAddr = mockAsset.ERC1155Asset
  const sellAsset = {
    tokenId,
    tokenAddress: tokenAddr,
    schemaName: 'ERC1155',
    collection
  }

  const sellerAssetBal = await sellContract.getERC1155Balances(mockAsset.ERC1155Asset, tokenId)

  console.log(sellContract.signerAddress, sellerAssetBal)

  const quantity = 12, partAmount = 0.0001
  const sellParams = {
    asset: sellAsset,
    quantity,
    startAmount: partAmount * quantity //总价
  } as SellOrderParams

  const signedOrder = await sellContract.createSellOrder(sellParams)
  // console.log(signedOrder)

  const buyContract = new ZeroExchange({
    chainId,
    address: buyAccount,
    rpcUrl: 'http://127.0.0.1:8545/'
  }, config)

  for (let i = 0; i < 1; i++) {
    const buyerBeforBal = await buyContract.getAccountBalance({})
    const sellerBeforBal = await sellContract.getAccountBalance({})


    const buyerBeforAsset = await buyContract.getERC1155Balances(tokenAddr, tokenId)
    const sellerBeforAsset = await buyContract.getERC1155Balances(tokenAddr, tokenId, sellAccount)


    const dealOrder = orderHashUtils.converStrOrder(signedOrder) as DealOrder

    const buyQty = new BigNumber(2)
    // console.assert(buyQty.gt(sellerBeforAsset), sellerBeforAsset)

    const tx = await buyContract.orderMatch(dealOrder, buyQty)
    await tx.wait()

    const receipt = await tx.wait()
    console.log('gasUsed', receipt.gasUsed.toString(), 'cumulativeGasUsed', receipt.cumulativeGasUsed.toString())
    let gasPrice = tx.gasPrice ? tx.gasPrice.toString() : '0'
    if (gasPrice == '0') {
      if (tx.maxFeePerGas && tx.maxPriorityFeePerGas) {
        gasPrice = tx.maxFeePerGas.add(tx.maxPriorityFeePerGas).toString()
      }
      if (gasPrice == '0') {
        throw 'tx error'
      }
    }

    const gasFee = new BigNumber(gasPrice).times(receipt.gasUsed.toString()).toString()
    const buyerAfterBal = await buyContract.getAccountBalance({})
    const buyerAfterAsset = await buyContract.getERC1155Balances(tokenAddr, tokenId)
    const sellerAfterAsset = await buyContract.getERC1155Balances(tokenAddr, tokenId, sellAccount)

    // check
    const txAmount = new BigNumber(buyQty).times(partAmount).times(new BigNumber(10).pow(18))
    const buySpend = new BigNumber(buyerBeforBal.ethBal).minus(gasFee).minus(txAmount)
    console.assert(buySpend.eq(buyerAfterBal.ethBal),
      `${buyerBeforBal.ethBal} -- ${buyerAfterBal.ethBal} --gasfee ${gasFee} -- ${txAmount}`)


    const buyerAsset = new BigNumber(buyerBeforAsset).plus(buyQty)
    const sellerAsset = new BigNumber(sellerBeforAsset).minus(buyQty)
    console.assert(buyerAsset.eq(buyerAfterAsset), `Buyer Asset bal ${buyerBeforAsset} -- ${buyerAfterAsset}`)
    console.assert(sellerAsset.eq(sellerAfterAsset), `Seller Asset bal ${sellerBeforAsset} -- ${sellerAfterAsset}`)

    // check fee

    console.log('Buy fillOrder ok \n', tx.hash)
  }
})()
