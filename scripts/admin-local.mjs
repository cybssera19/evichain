import 'dotenv/config'
import { ethers } from 'ethers'

const rpc = new URL(process.env.RPC_URL || 'http://127.0.0.1:8545')
if (!['127.0.0.1', 'localhost'].includes(rpc.hostname)) {
  throw new Error('This command only supports Hardhat on localhost.')
}
const provider = new ethers.JsonRpcProvider(rpc.href)
const chainId = Number((await provider.getNetwork()).chainId)
if (chainId !== 31337) throw new Error('Chain ID '+chainId+' is not the local Hardhat chain (31337).')
const wallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const key = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const registry = process.env.ROLE_CONTRACT_ADDRESS
if (!registry || await provider.getCode(registry) === '0x') {
  throw new Error('RoleRegistry is not deployed. Run npm run start:local first.')
}
const roles = new ethers.Contract(registry, ['function roles(address) view returns (uint8)'], provider)
if (Number(await roles.roles(wallet)) !== 1) throw new Error('This demo account is not an Admin on the current local instance.')
console.log('LOCAL DEMO ADMIN - chain 31337 only')
console.log('Address:      '+wallet)
console.log('Private key: '+key)
console.log('MetaMask: Import account → paste the private key → select EviChain Local → open http://127.0.0.1:5173')
console.log('Do not use this account on a public network or send it real funds.')
