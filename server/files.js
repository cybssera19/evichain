import {createHash} from 'node:crypto'
import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises'
import path from 'node:path'
import {fail} from './errors.js'
import {evidenceId,text} from './validation.js'

export function fileHandlers({pool,provider,contract,storageDir}) {
  const source = async () => `${(await provider.getNetwork()).chainId}:${(await contract.getAddress()).toLowerCase()}`
  const fields = 'evidence_id,original_name,size_bytes,uploaded_at'
  const upload = async (req,res) => {
    if(!evidenceId(req.params.id)) return fail(res,400,'INVALID_REQUEST')
    if(!req.file) return fail(res,400,'FILE_REQUIRED')
    if(!text(req.file.originalname,255,true)) return fail(res,400,'INVALID_REQUEST')
    if(BigInt(req.params.id)>=await contract.nextId()) return fail(res,404,'NOT_FOUND')
    let evidence
    try { evidence=await contract.getEvidence(req.params.id) } catch(error) {
      if(error.code==='CALL_EXCEPTION') return fail(res,404,'NOT_FOUND')
      throw error
    }
    const hash='0x'+createHash('sha256').update(req.file.buffer).digest('hex')
    if(evidence.creator.toLowerCase()!==req.wallet.toLowerCase() || evidence.fileHash.toLowerCase()!==hash) return fail(res,403,'FILE_MISMATCH')
    const key=await source(), client=await pool.connect()
    let written
    try {
      await client.query('BEGIN')
      
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key+':'+req.params.id])
      const previous=(await client.query(`SELECT ${fields},sha256,uploader,stored_name FROM evidence_files WHERE source_key=$1 AND evidence_id=$2`,[key,req.params.id])).rows[0]
      if(previous) {
        if(previous.sha256!==hash || previous.uploader.toLowerCase()!==req.wallet.toLowerCase()) { await client.query('ROLLBACK'); return fail(res,409,'FILE_CONFLICT') }
        if(path.basename(previous.stored_name)!==previous.stored_name) throw new Error('Invalid stored file path')
        const target=path.join(storageDir,previous.stored_name)
        try {
          const actual='0x'+createHash('sha256').update(await readFile(target)).digest('hex')
          if(actual!==hash) throw new Error('Stored file integrity mismatch')
        } catch(error) {
          if(error.code!=='ENOENT') throw error
          await mkdir(storageDir,{recursive:true}); await writeFile(target,req.file.buffer,{flag:'wx'})
        }
        const {sha256:_,uploader:__,stored_name:___,...publicRow}=previous
        await client.query('COMMIT'); return res.json(publicRow)
      }
      if([3,4,5].includes(Number(evidence.status))) { await client.query('ROLLBACK'); return fail(res,409,'EVIDENCE_FINAL') }
      await mkdir(storageDir,{recursive:true})
      
      const storedName=`${createHash('sha256').update(key).digest('hex')}-${req.params.id}-${hash.slice(2)}`
      const target=path.join(storageDir,storedName)
      try { await writeFile(target,req.file.buffer,{flag:'wx'}); written=target }
      catch(error) {
        if(error.code!=='EEXIST') throw error
        const recovered='0x'+createHash('sha256').update(await readFile(target)).digest('hex')
        if(recovered!==hash) throw new Error('Stored file integrity mismatch')
      }
      const row=(await client.query(`INSERT INTO evidence_files(source_key,evidence_id,stored_name,original_name,size_bytes,uploader,sha256) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${fields}`,[key,req.params.id,storedName,req.file.originalname,req.file.size,req.wallet,hash])).rows[0]
      await client.query('COMMIT'); written=undefined
      res.json(row)
    } catch(error) {
      await client.query('ROLLBACK').catch(()=>{})
      if(written) await unlink(written).catch(()=>{})
      throw error
    } finally { client.release() }
  }
  const list=async (_req,res)=>{
    const rows=(await pool.query(`SELECT ${fields},sha256,uploader FROM evidence_files WHERE source_key=$1`,[await source()])).rows
    const result=[]
    const nextId=await contract.nextId()
    for(const row of rows) {
      if(BigInt(row.evidence_id)>=nextId) continue
      let evidence
      try { evidence=await contract.getEvidence(row.evidence_id) } catch(error) { if(error.code==='CALL_EXCEPTION') continue; throw error }
      if(evidence.fileHash.toLowerCase()!==row.sha256 || evidence.creator.toLowerCase()!==row.uploader.toLowerCase()) continue
      const {sha256:_,uploader:__,...publicRow}=row; result.push(publicRow)
    }
    res.json(result)
  }
  return {upload,list}
}
