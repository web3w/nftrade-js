import { BigNumber } from 'web3-wallets'


/**
 * Generates a pseudo-random 256-bit salt.
 * The salt can be included in a 0x order, ensuring that the order generates a unique orderHash
 * and will not collide with other outstanding orders that are identical in all other parameters.
 * @return  A pseudo-random 256-bit number that can be used as a salt.
 */
export function generatePseudoRandomSalt(): BigNumber {
  return BigNumber.random(10).times(1e10)
}


export function computerExpirationAndSalt(expirationTime: number) {
  const nowMS = parseInt(String((new Date()).getTime() / 1000))
  const salt = new BigNumber(nowMS.toString())
  const expirationTimeSeconds = expirationTime ? new BigNumber(expirationTime).toFixed(0) : salt.plus(7 * 24 * 60 * 60).toFixed(0)
  return { salt, expirationTimeSeconds }
}

// console.log(generatePseudoRandomSalt().toString())



