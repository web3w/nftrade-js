/* globals describe:false,it:false */

const Web3 = require('web3')
const secrets = require('../../../../secrets.json')
// let web3Provider = new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${secrets.infuraKey}`)

// curl -X POST --header "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"qn_fetchNFTs","params":["0x91b51c173a4bdaa1a60e234fc3f705a16d228740", ["0x2106c00ac7da0a3430ae667879139e832307aeaa", "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D"]],"id":67}' https://api.element.market/api/v1/jsonrpc
// curl -X POST --header "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"trace_RPC","params":[],"id":83}' https://api.element.market/api/v1/jsonrpc
// curl -X POST --header "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":83}' https://api.element.market/api/v1/jsonrpc

// Erigon v2021.08.02: 增加了 txpool_status、eth_maxPriorityFeePerGas、eth_feeHistory、trace_RPC 方法

let web3Provider = new Web3.providers.HttpProvider(`https://api.element.market/api/v1/jsonrpc`)
const web3 = new Web3(web3Provider)
;(async () => {
  web3.eth.extend({
    property: 'gasFee',
    methods: [{
      name: 'maxPriorityFeePerGas',
      call: 'eth_maxPriorityFeePerGas'
    }]
  });
  const maxPriorityFeePerGas = await  web3.eth.gasFee.maxPriorityFeePerGas()

  console.log(parseInt(maxPriorityFeePerGas).toString())
  return

  web3.eth.extend({
    property: 'txpool',
    methods: [{
      name: 'content',
      call: 'txpool_content'
    },{
      name: 'inspect',
      call: 'txpool_inspect'
    },{
      name: 'status',
      call: 'txpool_status'
    }]
  });

  web3.eth.txpool.status().then(console.log).catch(console.error)

})()
