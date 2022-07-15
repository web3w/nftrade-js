export {ContractABI} from './abi'

export interface ZeroV3ContractsAddresses {
    ForwarderEx: string,
    Exchange: string,
    ERC20Proxy: string,
    ERC721Proxy: string,
    ERC1155Proxy: string,
    FeeDispatcher: string,
    FeeRecipient: string,
    GasToken: string
}

export const NFTREADE_CONTRACTS_ADDRESSES: { [key: number]: ZeroV3ContractsAddresses } = {
    56: {
        'ForwarderEx': '0xc28f1550160478a7fb3b085f25d4b179e08e649a',
        'Exchange': '0xcfb6ee27d82beb1b0f3ad501b968f01cd7cc5961',
        'ERC20Proxy': '0xE05D2BAA855C3dBA7b4762D2f02E9012Fb5F3867',
        'ERC721Proxy': '0x2559Be60A7040D645D263cA54c936320f90be74b',
        'ERC1155Proxy': '0x295f911ccb8C771593375a4e8969A124bad725d8',
        'FeeDispatcher': '0x0000000000000000000000000000000000000000',
        'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
        'GasToken': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    },
    137: {
        'ForwarderEx': '0x7057FF0A3808E65E7f117c914Fc5ccbB70C65F88',
        'Exchange': '0xcfb6ee27d82beb1b0f3ad501b968f01cd7cc5961',
        'ERC20Proxy': '0xE05D2BAA855C3dBA7b4762D2f02E9012Fb5F3867',
        'ERC721Proxy': '0x2559Be60A7040D645D263cA54c936320f90be74b',
        'ERC1155Proxy': '0x295f911ccb8C771593375a4e8969A124bad725d8',
        'FeeDispatcher': '0x0000000000000000000000000000000000000000',
        'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
        'GasToken': '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
    },
    43114: {
        'ForwarderEx': '0x05b79e830a72711334B01bdaa94121E9f6557b77',
        'Exchange': '0xcFB6Ee27d82beb1B0f3aD501B968F01CD7Cc5961',
        'ERC20Proxy': '0xe05d2baa855c3dba7b4762d2f02e9012fb5f3867',
        'ERC721Proxy': '0x2559be60a7040d645d263ca54c936320f90be74b',
        'ERC1155Proxy': '0x295f911ccb8c771593375a4e8969a124bad725d8',
        'FeeDispatcher': '0x0000000000000000000000000000000000000000',
        'FeeRecipient': '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401',
        'GasToken': '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    }
}

export const ZEROEX_V3_CONTRACTS_ADDRESSES: { [key: number]: ZeroV3ContractsAddresses } = {
    4: {
        'ForwarderEx': '0xe30f6166fe1cd5f0048abeed3d20360feb4a1fd8',
        'Exchange': '0xF8BecAcec90bFc361C0A2C720839E08405A72F6D',
        'ERC20Proxy': '0x070efeb7e5ffa3d1a59d03a219539551ae60ba43',
        'ERC721Proxy': '0x7f10d80f2659aaae790ab03da12be11c4e6008c3',
        'ERC1155Proxy': '0xaa460127562482faa5df42f2c39a025cd4a1cc0a',
        'FeeDispatcher': '0xd4634Def693cBDC82FB8a097baaAB75A50252A51',
        'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
        'GasToken': '0xc778417e063141139fce010982780140aa0cd5ab'
    },
    137: {
        'ForwarderEx': '0xA6D6E6fD317416Ac9FD839AEf6284df047cDDeE3',
        'Exchange': '0xcfb6ee27d82beb1b0f3ad501b968f01cd7cc5961',
        'ERC20Proxy': '0xE05D2BAA855C3dBA7b4762D2f02E9012Fb5F3867',
        'ERC721Proxy': '0x2559Be60A7040D645D263cA54c936320f90be74b',
        'ERC1155Proxy': '0x295f911ccb8C771593375a4e8969A124bad725d8',
        'FeeDispatcher': '0x0000000000000000000000000000000000000000',
        'FeeRecipient': '0x7538262ae993ca117a0e481f908209137a46268e',
        'GasToken': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
    },
    43114: {
        'ForwarderEx': '0x05b79e830a72711334B01bdaa94121E9f6557b77', //0xc28f1550160478a7fb3b085f25d4b179e08e649a
        'Exchange': '0xcFB6Ee27d82beb1B0f3aD501B968F01CD7Cc5961',
        'ERC20Proxy': '0xe05d2baa855c3dba7b4762d2f02e9012fb5f3867',
        'ERC721Proxy': '0x2559be60a7040d645d263ca54c936320f90be74b',
        'ERC1155Proxy': '0x295f911ccb8c771593375a4e8969a124bad725d8',
        'FeeDispatcher': '0x0000000000000000000000000000000000000000',
        'FeeRecipient': '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401',
        'GasToken': '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    }
}


export const EXSWAP_CONTRACTS_ADDRESSES = {
    4: {
        ExSwap: '0x1A365EC4d192F7ddE7c5c638DD4871653D93Ee06',
        0: '0xdD54D660178B28f6033a953b0E55073cFA7e3744', // opensea
        1: '0x7ac5c8568122341f5D2c404eC8F9dE56456D60CA',//elementV1
        2: '0x8D6022B8A421B08E9E4cEf45E46f1c83C85d402F',//elementV3
        3: '0x18f256732A5c980E450b2b8c32ad2F12ca2442f8',//ZeroExV4
        4: '0xCD801026313a91Ef3B54B866Ce09eb3F52c64C3F'//'0xE269CB9804c4aB82e092C38deb35345eC43Fe829',//ZeroExV3
    },
    56: {
        ExSwap: '0xfcf9a0f1B96C1fE246A6f2b8560800B0259A49AF',
        0: '0xb3e3DfCb2d9f3DdE16d78B9e6EB3538Eb32B5ae1', // elementV3
        1: '0x86FC0fC9f9b2A47b45fcA2196873d14B6e0d4A0b' //nftrade
    },
    97: { // v2
        ExSwap: '0x7bdfc89767fe31af9fb78b755b870bd82369f7df',
        0: '0x30FAD3918084eba4379FD01e441A3Bb9902f0843', // elementV3
        1: '0xf9dc7E85D021f81Ff13c05c5C2a2836BAa3aa499' // zeroV3
    },
    137: {
        ExSwap: '0x0F49A3096a0Ad5eea486080aB1e5F89f74f33dbC',
        0: '0xEAF5453b329Eb38Be159a872a6ce91c9A8fb0260', // elementV3
        1: '0x7057FF0A3808E65E7f117c914Fc5ccbB70C65F88' // nftrade
    },
    43114: {
        ExSwap: '0x5670aF3b392943323AAbbfb672beCD739eC3DcC1',
        0: '0x18cd9270DbdcA86d470cfB3be1B156241fFfA9De',// elementV3
        1: '0x05b79e830a72711334B01bdaa94121E9f6557b77'// nftrade
    }
}
