// Sementara semua transaksi masih tiruan. Kalau kontrak EvidenceRegistry sudah
// deploy di Sepolia, fungsi di file ini yang diganti pakai ethers.js.

export const CONTRACT = {
  name: 'EvidenceRegistry',
  address: '0xd5e1b04a9f27c3e86d0b5a14e9c2f73d8a6e8b15',
  network: 'Sepolia',
  chainId: 11155111,
}

const hex = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

export const randomTx = () => `0x${hex(16)}`

export const nextBlock = (last) => last + 600 + Math.floor(Math.random() * 2400)

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function siweMessage(address) {
  const nonce = hex(16)
  const issued = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  return [
    'evichain.app meminta Anda masuk dengan akun Ethereum:',
    address,
    '',
    'Masuk ke EviChain.',
    '',
    'URI: https://evichain.app',
    'Version: 1',
    `Chain ID: ${CONTRACT.chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issued}`,
  ].join('\n')
}
