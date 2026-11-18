import 'dotenv/config'
import pg from 'pg'
import { ethers } from 'ethers'
import { createApp } from './app.js'
if (!process.env.CONTRACT_ADDRESS) throw new Error('Set CONTRACT_ADDRESS')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545')
if (process.env.NODE_ENV === 'production' && (await provider.getNetwork()).chainId === 31337n)
  throw new Error('Hardhat demo chain is development only')
const abi = [
  'function roleVersion(address) view returns(uint256)',
  'function roles(address) view returns (uint8)',
  'function deploymentVersion() view returns (uint256)',
  'function caseRegistry() view returns(address)',
  'function nextId() view returns (uint256)',
  'function getEvidence(uint256) view returns ((uint256 id,string caseId,string kind,bytes32 fileHash,address holder,uint8 status,address creator,uint256 createdAt,bool exists))',
]
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider)
if (Number(await contract.deploymentVersion()) !== 2)
  throw new Error('Deploy EvidenceRegistry v2 before starting API')
const app = createApp({ pool, provider, contract })
const port = Number(process.env.API_PORT || 3001)
app.listen(port, process.env.API_HOST || '127.0.0.1', () =>
  console.log('EviChain API http://127.0.0.1:' + port),
)
