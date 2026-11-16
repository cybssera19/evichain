import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import { evidenceCode, formatBlock, formatSize, shortHash } from '../lib/format'
import { sha256File } from '../lib/hash'
import { BigTag } from '../components/Tags'
import Bag from '../components/Bag'
import { ChainIcon, Check, ChevronRight, FileIcon, Lock, Plus } from '../components/Icons'
import './register.css'

export default function Register() {
  const { state, me, actions, requestTx, notify } = useStore()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const openCases = state.cases.filter((c) => c.status !== 'Selesai')

  const [caseNo, setCaseNo] = useState((openCases.find((c) => c.createdBy === me.id) ?? openCases[0])?.no ?? '')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState(null)
  const [hash, setHash] = useState('')
  const [hashing, setHashing] = useState(false)

  if (me.role !== 'Penyidik') return <Navigate to="/bukti" replace />

  const nextId = Math.max(...state.evidence.map((e) => e.id)) + 1

  const pick = async (f) => {
    if (!f) return
    setFile(f)
    setHash('')
    setHashing(true)
    setHash(await sha256File(f))
    setHashing(false)
  }

  const ready = caseNo && name.trim() && hash
  const duplicate = hash && state.evidence.find((e) => e.hash === hash)

  const submit = async (e) => {
    e.preventDefault()
    if (!ready) return
    const ok = await requestTx({ fn: 'registerEvidence()', params: `${evidenceCode(nextId)}, ${caseNo}` })
    if (!ok) return
    const { item, event } = actions.register({
      name: name.trim(),
      caseNo,
      note: note.trim(),
      file: { name: file.name, size: file.size },
      hash,
    })
    notify({ title: `Bukti ${evidenceCode(item.id)} tercatat di blok ${formatBlock(event.block)}`, body: `${item.name}, ${caseNo}`, tx: event.tx })
    navigate('/bukti', { state: { newId: item.id } })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="crumbs">
            <Link to="/bukti">Barang bukti</Link>
            <ChevronRight />
            <span className="current">Registrasi</span>
          </div>
          <h1>Registrasi barang bukti</h1>
        </div>
      </div>

      <div className="reg-grid">
        <form className="paper reg-form" onSubmit={submit}>
          <div className="field">
            <label>
              Kasus<span className="req">*</span>
            </label>
            <select className="input" value={caseNo} onChange={(e) => setCaseNo(e.target.value)}>
              {openCases.map((c) => (
                <option key={c.no} value={c.no}>
                  {c.no}  {c.title}
                </option>
              ))}
            </select>
            <Link to="/kasus" state={{ add: true }} className="add-case">
              <Plus /> Tambah kasus baru
            </Link>
          </div>

          <div className="field">
            <label>
              Jenis barang bukti<span className="req">*</span>
            </label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Misalnya Hard disk eksternal" required />
          </div>

          <div className="field">
            <label>Catatan</label>
            <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Kondisi segel, lokasi penyitaan, dan keterangan lain" />
          </div>

          <div className="field">
            <label>
              File bukti<span className="req">*</span>
            </label>
            {file ? (
              <div className="input file-pick">
                <FileIcon />
                <div>
                  <b className="mono">{file.name}</b>
                  <span className="muted">{formatSize(file.size)} dipilih dari perangkat</span>
                </div>
                <button type="button" className="btn btn-paper" onClick={() => fileInput.current.click()}>
                  Ganti file
                </button>
              </div>
            ) : (
              <button type="button" className="input file-empty" onClick={() => fileInput.current.click()}>
                Pilih file image atau arsip bukti
              </button>
            )}
            <input ref={fileInput} type="file" hidden onChange={(e) => pick(e.target.files[0])} />
          </div>

          <div className="field">
            <span className="label reg-hash-label">
              Hash SHA-256
              {hash && (
                <span className="computed">
                  <Check /> Dihitung di browser
                </span>
              )}
            </span>
            <div className="input locked mono reg-hash">{hashing ? 'Menghitung…' : hash || 'Muncul setelah file dipilih'}</div>
            {duplicate ? (
              <span className="hint" style={{ color: 'var(--red)' }}>
                Hash ini sudah terdaftar sebagai {evidenceCode(duplicate.id)}. Pastikan bukan registrasi ganda.
              </span>
            ) : (
              <span className="hint">
                <Lock /> File asli disimpan di server privat. Yang masuk blockchain hanya hash-nya.
              </span>
            )}
          </div>

          <div className="clip-foot">
            <Link to="/bukti" className="btn btn-text btn-lg">
              Batal
            </Link>
            <button className="btn btn-red btn-lg" disabled={!ready}>
              Daftarkan ke blockchain
            </button>
          </div>
        </form>

        <div className="reg-side">
          <div className="section-title">
            <h2>Pratinjau label</h2>
          </div>
          <div className="reg-preview">
            <BigTag status="Collected" width={380} cut={36} band={54} hole={10}>
              <div className="pv-id">
                <span className="mono">{evidenceCode(nextId)}</span>
                <span className="pv-auto">otomatis</span>
              </div>
              <h3 className={`pv-name ${name ? '' : 'empty'}`}>{name || 'Jenis barang bukti'}</h3>
              <ul className="pv-fields">
                <li>
                  <span>Kasus</span>
                  <b className="mono">{caseNo}</b>
                  <ChainIcon />
                </li>
                <li>
                  <span>Pemegang awal</span>
                  <b>{me.name}, wallet Anda</b>
                  <ChainIcon />
                </li>
                <li>
                  <span>Hash SHA-256</span>
                  <b className="mono">{hash ? shortHash(hash) : 'menunggu file'}</b>
                  <ChainIcon />
                </li>
                <li>
                  <span>Dicatat pada</span>
                  <b>Waktu dan nomor blok</b>
                  <ChainIcon />
                </li>
              </ul>
              <hr className="perforation" />
              <div className="pv-foot">
                <span className="stamp" style={{ color: 'var(--blue)', borderWidth: 2, fontSize: 14, fontWeight: 700, transform: 'rotate(-4deg)' }}>
                  Collected
                </span>
                <span className="pv-chip">
                  <ChainIcon /> On-chain
                </span>
              </div>
            </BigTag>
          </div>

          <Bag>
            <div className="offchain">
              <div className="offchain-head">
                <b>Disimpan di server privat</b>
                <span className="pv-chip muted">
                  <Lock /> Off-chain
                </span>
              </div>
              <span className="mono">
                <i /> {file?.name ?? 'file bukti asli'}
              </span>
              <span>
                <i /> Catatan lengkap dan detail kasus
              </span>
            </div>
          </Bag>
        </div>
      </div>
    </>
  )
}
