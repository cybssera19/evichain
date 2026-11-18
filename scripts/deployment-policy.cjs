const { HDNodeWallet } = require('ethers')
function checkDeployer(chainId, address) {
  if (BigInt(chainId) === 31337n) return
  for (let i = 0; i < 20; i++) {
    const demo = HDNodeWallet.fromPhrase(
      'test test test test test test test test test test test junk',
      undefined,
      `m/44'/60'/0'/0/${i}`,
    )
    if (demo.address.toLowerCase() === address.toLowerCase())
      throw Error('Public networks must not use a Hardhat demo key')
  }
}
module.exports = { checkDeployer }
