import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { installAuth } from './auth.js'
import { fail } from './errors.js'
import { profile } from './validation.js'
import { fileHandlers } from './files.js'
import { caseHandlers } from './cases.js'
import { uploadGuard } from './upload-guard.js'
import path from 'node:path'
import multer from 'multer'
import { ethers } from 'ethers'

export function createApp({ pool, provider, contract, storageDir = path.resolve('server/private-files') }) {
const app = express()
const roleNames = ['None', 'Admin', 'Investigator', 'Analyst', 'Auditor']
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173', credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const normalize = (wallet) => {
  try { return ethers.getAddress(wallet) } catch { throw Object.assign(new Error('INVALID_WALLET'), { status: 400 }) }
}
const currentRole = async (wallet) => roleNames[Number(await contract.roles(wallet))] || 'None'
const auth = installAuth(app, { pool, currentRole, currentVersion: (wallet) => contract.roleVersion(wallet), wrap })
const only = (role) => (req, res, next) => req.role === role ? next() : fail(res, 403, 'Insufficient role')
const assigned = (req, res, next) => req.role === 'None' ? fail(res, 403, 'Awaiting role approval') : next()

app.get('/api/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ ok: true, chainId: Number((await provider.getNetwork()).chainId), contractAddress: await contract.getAddress(), version: Number(await contract.deploymentVersion()) })
}))
app.get('/api/me', auth, wrap(async (req, res) => {
  const user = (await pool.query('SELECT * FROM users WHERE wallet=$1', [req.wallet])).rows[0]
  res.json({ wallet: req.wallet, role: req.role, user })
}))
app.post('/api/register', auth, only('None'), wrap(async (req, res) => {
  const { name, email = '', unit = '', requestedRole } = req.body || {}
  if (!profile({name,email,unit})) return fail(res, 400, 'Invalid profile')
  if (!['Investigator', 'Analyst', 'Auditor'].includes(requestedRole)) return fail(res, 400, 'Choose a valid role')
  const user = (await pool.query('INSERT INTO users(wallet,name,email,unit,requested_role) VALUES($1,$2,$3,$4,$5) ON CONFLICT(wallet) DO UPDATE SET name=$2,email=$3,unit=$4,requested_role=$5 RETURNING *', [req.wallet, name.trim(), email.trim(), unit.trim(), requestedRole])).rows[0]
  res.json({ wallet: req.wallet, role: req.role, user })
}))
app.get('/api/users', auth, assigned, wrap(async (req, res) => {
  const fields = req.role === 'Admin' ? 'wallet,name,nip,unit,email,requested_role' : 'wallet,name,unit'
  const users = (await pool.query('SELECT '+fields+' FROM users ORDER BY name')).rows
  const rows = await Promise.all(users.map(async (u) => ({ ...u, role: await currentRole(u.wallet) })))
  res.json(req.role === 'Admin' ? rows : rows.filter(u => u.role !== 'None'))
}))
app.post('/api/users', auth, only('Admin'), wrap(async (req, res) => {
  const wallet = normalize(req.body?.wallet)
  const { name, nip = '', unit = '', email = '' } = req.body || {}
  if (!profile({name,nip,unit,email})) return fail(res, 400, 'Invalid profile')
  const row = (await pool.query('INSERT INTO users(wallet,name,nip,unit,email) VALUES($1,$2,$3,$4,$5) ON CONFLICT(wallet) DO UPDATE SET name=$2,nip=$3,unit=$4,email=$5 RETURNING *', [wallet, name.trim(), nip, unit, email])).rows[0]
  res.json(row)
}))
app.delete('/api/users/:wallet', auth, only('Admin'), wrap(async (req, res) => {
  const wallet = normalize(req.params.wallet)
  if (await currentRole(wallet) !== 'None') return fail(res, 409, 'Revoke role on-chain first')
  await pool.query('DELETE FROM users WHERE wallet=$1', [wallet])
  res.json({ ok: true })
}))
const cases = caseHandlers({pool,provider,contract})
app.get('/api/cases', auth, assigned, wrap(cases.list))
app.post('/api/cases', auth, only('Admin'), wrap(cases.save))
app.delete('/api/cases/:no', auth, only('Admin'), wrap(cases.remove))
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1, fields: 0, parts: 1 } })
const files = fileHandlers({pool,provider,contract,storageDir})
app.post('/api/evidence/:id/file', auth, only('Investigator'), uploadGuard(), upload.single('file'), wrap(files.upload))
app.get('/api/evidence/files', auth, assigned, wrap(files.list))
app.use('/api', (_req, res) => fail(res, 404, 'NOT_FOUND'))
app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') return fail(res, 413, 'FILE_TOO_LARGE')
  if (error instanceof multer.MulterError) return fail(res, 400, 'INVALID_REQUEST')
  if (error.type === 'entity.parse.failed') return fail(res, 400, 'INVALID_REQUEST')
  console.error('API request failed:', error.code || error.name)
  fail(res, error.status || 500, error.status ? error.message : 'SERVER_ERROR')
})
return app
}
