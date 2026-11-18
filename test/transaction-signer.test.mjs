import assert from 'node:assert/strict'
import test from 'node:test'
import { transactionSigner } from '../src/lib/transactionSigner.js'
import { errorMessage } from '../src/lib/errors.js'

test('local transactions use the chain nonce even when the wallet cached a later nonce', async () => {
  let sent
  const signer = {
    provider: { getTransactionCount: async () => 6 },
    getAddress: async () => '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    sendTransaction: async (tx) => {
      sent = tx
      return tx
    },
  }
  const rpc = { getTransactionCount: async () => 2 }

  await transactionSigner(signer, 31337, rpc).sendTransaction({ to: '0x5FbDB2315678afecb367f032d93F642f64180aa3' })
  assert.equal(sent.nonce, 2)
  assert.equal(transactionSigner(signer, 11155111, rpc), signer)
})

test('nonce errors show the expected and sent values', () => {
  assert.equal(
    errorMessage({ error: { message: 'Nonce too high. Expected nonce to be 2 but got 6.' } }),
    'Wallet sent nonce 6, but the chain expects 2. Reload and try again.',
  )
})
