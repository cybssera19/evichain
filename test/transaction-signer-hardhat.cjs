const assert = require('node:assert/strict')
const hre = require('hardhat')

describe('local transaction nonce', function () {
  it('assigns a role when the wallet proposes a stale nonce', async function () {
    const [admin, recipient] = await hre.ethers.getSigners()
    const roles = await hre.ethers.deployContract('RoleRegistry')
    await roles.waitForDeployment()
    const { transactionSigner } = await import('../src/lib/transactionSigner.js')
    const staleWallet = {
      provider: admin.provider,
      getAddress: () => admin.getAddress(),
      populateTransaction: async (tx) => ({ ...await admin.populateTransaction(tx), nonce: 6 }),
      sendTransaction: (tx) => admin.sendTransaction(tx),
    }

    const contract = roles.connect(transactionSigner(staleWallet, 31337, admin.provider))
    await (await contract.setRole(await recipient.getAddress(), 2)).wait()
    assert.equal(Number(await roles.roles(await recipient.getAddress())), 2)
  })
})
