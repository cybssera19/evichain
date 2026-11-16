import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import { evidenceCode, formatBlock, formatDateTime, formatShort, formatSize } from '../lib/format'
import { isSha256, sha256File } from '../lib/hash'
import { TapeH } from '../components/Tape'
import { RowTag } from '../components/Tags'
import { ChevronRight, Close, FileIcon } from '../components/Icons'
import './verify.css'

const chunks = (h) => Array.from({ length: 8 }, (_, i) => h.slice(i * 8, i * 8 + 8))

function HashRow({ label, hash, against }) {
  return (
    <div className="hash-row">
      <span className="label">{label}</span>
      <div className="hash-chunks">
        {chunks(hash).map((c, i) => {
          const ok = !against || c === chunks(against)[i]
          return (
            <span key={i} className={`chunk mono ${ok ? 'ok' : 'bad'}`}>
              {c}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function Verify() {
  const { state, actions } = useStore()
  const { item, user, eventsOf } = useLookup()
  const [params] = useSearchParams()
  const fileInput = useRef(null)

  const choices = [...state.evidence].sort((a, b) => b.id - a.id)
  const [evidenceId, setEvidenceId] = useState(Number(params.get('bukti')) || choices.find((e) => e.status !== 'Voided')?.id)
  const [file, setFile] = useState(null)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const target = item(evidenceId)
  const canCheck = target && (file || isSha256(pasted))

  const run = async (e) => {
    e.preventDefault()
    if (!canCheck) return
    setBusy(true)
    const hash = file ? await sha256File(file) : pasted.trim().toLowerCase()
    const match = hash === target.hash
    const record = actions.addVerification(target.id, match)
    setResult({ hash, match, at: record.at, evidence: target })
    setBusy(false)
  }

  const history = [...state.verifications].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)
  const regEvent = result && eventsOf(result.evidence.id).find((e) => e.type === 'register')

  return (
    <>
      <div className="page-head">
        <h1>Verifikasi integritas</h1>
      </div>

      <div className="verify-grid">
        <form className="paper verify-form" onSubmit={run}>
          <div className="field">
            <label>
              Barang bukti<span className="req">*</span>
            </label>
            <select className="input" value={evidenceId} onChange={(e) => { setEvidenceId(Number(e.target.value)); setResult(null) }}>
              {choices.map((e) => (
                <option key={e.id} value={e.id}>
                  {evidenceCode(e.id)}  {e.name}  {e.caseNo}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>File yang dicek</label>
            {file ? (
              <div className="input file-pick">
                <FileIcon />
                <div>
                  <b className="mono">{file.name}</b>
                  <span className="muted">{formatSize(file.size)}, hash dihitung di browser</span>
                </div>
                <button type="button" className="icon-btn" onClick={() => setFile(null)} aria-label="Hapus file">
                  <Close size={16} />
                </button>
              </div>
            ) : (
              <button type="button" className="input file-empty" onClick={() => fileInput.current.click()}>
                Pilih file dari perangkat
              </button>
            )}
            <input ref={fileInput} type="file" hidden onChange={(e) => { setFile(e.target.files[0] ?? null); setPasted('') }} />
          </div>

          <div className="or">
            <span>atau</span>
          </div>

          <div className="field">
            <label>Tempel hash SHA-256</label>
            <input
              className="input mono"
              style={{ fontSize: 13 }}
              value={pasted}
              disabled={!!file}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="64 karakter heksadesimal"
            />
            {pasted && !isSha256(pasted) && <span className="hint" style={{ color: 'var(--red)' }}>Hash harus 64 karakter 0 sampai 9 atau a sampai f</span>}
          </div>

          <div className="clip-foot">
            <button className="btn btn-green btn-lg" disabled={!canCheck || busy}>
              {busy ? 'Menghitung…' : 'Verifikasi'}
            </button>
          </div>
        </form>

        <section className="paper verify-result">
          {result ? (
            <>
              <div className="result-head">
                <div>
                  <h2>{result.match ? 'Hash cocok' : 'Hash tidak cocok'}</h2>
                  <p className="muted">
                    {evidenceCode(result.evidence.id)} {result.evidence.name}
                  </p>
                </div>
                <span className={`result-stamp ${result.match ? '' : 'bad'}`}>{result.match ? 'Integritas terjaga' : 'File berbeda'}</span>
              </div>
              <HashRow label="Hash file Anda" hash={result.hash} against={result.evidence.hash} />
              <div className="ticks">
                {chunks(result.hash).map((c, i) => (
                  <span key={i} className={c === chunks(result.evidence.hash)[i] ? 'ok' : 'bad'} />
                ))}
              </div>
              <HashRow label={`Hash on-chain ${evidenceCode(result.evidence.id)}`} hash={result.evidence.hash} />
              <div className="result-meta">
                <div>
                  <span>Diverifikasi</span>
                  <b>{formatDateTime(result.at)}</b>
                </div>
                {regEvent && (
                  <div>
                    <span>Blok registrasi</span>
                    <b className="mono">{formatBlock(regEvent.block)}</b>
                  </div>
                )}
                <div>
                  <span>Didaftarkan oleh</span>
                  <b>{user(result.evidence.registeredBy)?.name}</b>
                </div>
              </div>
              <Link to={`/bukti/${result.evidence.id}`} className="result-link">
                Buka detail bukti <ChevronRight />
              </Link>
            </>
          ) : (
            <div className="result-empty">
              <h2>Belum ada hasil</h2>
              <p className="muted">
                Pilih barang bukti, lalu pilih file atau tempel hash-nya. Hash dicocokkan dengan yang tercatat di blockchain saat
                registrasi.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="section-title" style={{ marginTop: 48 }}>
        <h2>Riwayat verifikasi</h2>
      </div>
      <TapeH
        segments={history.map((v) => {
          const ev = item(v.evidenceId)
          return (
            <div key={v.id} className="verif-seg">
              <div>
                <div className="verif-id">
                  <RowTag status={ev?.status} size={16} />
                  <span className="mono">{evidenceCode(v.evidenceId)}</span>
                </div>
                <b>{ev?.name}</b>
                <span className="stamp" style={{ color: v.match ? 'var(--green)' : 'var(--red)', fontWeight: 700, marginTop: 8 }}>
                  {v.match ? 'Cocok' : 'Tidak cocok'}
                </span>
              </div>
              <div className="verif-foot">
                <span>{formatShort(v.at)}</span>
                <span>oleh {user(v.by)?.name ?? 'Pengguna dihapus'}</span>
              </div>
            </div>
          )
        })}
      />
    </>
  )
}
