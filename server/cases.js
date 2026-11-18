import { ethers } from 'ethers'
import { caseAbi, caseStages, caseHash, canonicalCase } from '../shared/cases.js'
import { caseData } from './validation.js'
import { fail } from './errors.js'

export function caseHandlers({ pool, provider, contract }) {
  const registry = async () => new ethers.Contract(await contract.caseRegistry(), caseAbi, provider)
  const source = async () =>
    `${(await provider.getNetwork()).chainId}:${(await contract.getAddress()).toLowerCase()}`
  const matches = (row, record) =>
    record.exists &&
    Number(record.stage) < 3 &&
    caseStages[Number(record.stage)] === row.status &&
    record.metadataHash === caseHash(row)
  return {
    list: async (_req, res) => {
      const rows = (
        await pool.query(
          'SELECT no,title,description,status,created_by,created_at FROM cases WHERE source_key=$1 ORDER BY created_at DESC',
          [await source()],
        )
      ).rows
      const chain = await registry(),
        result = []
      for (const row of rows) if (matches(row, await chain.getCase(row.no))) result.push(row)
      res.json(result)
    },
    save: async (req, res) => {
      if (!caseData(req.body || {})) return fail(res, 400, 'INVALID_CASE')
      const data = canonicalCase(req.body),
        chain = await registry()
      if (!matches(data, await chain.getCase(data.no))) return fail(res, 409, 'CASE_CHAIN_MISMATCH')
      const row = (
        await pool.query(
          'INSERT INTO cases(source_key,no,title,description,status,created_by) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(source_key,no) DO UPDATE SET title=$3,description=$4,status=$5 RETURNING no,title,description,status,created_by,created_at',
          [await source(), data.no, data.title, data.description, data.status, req.wallet],
        )
      ).rows[0]
      res.json(row)
    },
    remove: async (req, res) => {
      if (!/^[A-Za-z0-9._/-]{1,64}$/.test(req.params.no)) return fail(res, 400, 'INVALID_CASE')
      const record = await (await registry()).getCase(req.params.no)
      if (!record.exists || Number(record.stage) !== 3) return fail(res, 409, 'CASE_DELETE_ONCHAIN')
      await pool.query('DELETE FROM cases WHERE source_key=$1 AND no=$2', [
        await source(),
        req.params.no,
      ])
      res.json({ ok: true })
    },
  }
}
