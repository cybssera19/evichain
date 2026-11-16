import { useState } from 'react'
import { useStore } from '../store/AppStore'
import ClipboardModal, { ClipFoot } from './Clipboard'
import { Database, Lock } from './Icons'

export function nextCaseNo(cases) {
  const year = new Date().getFullYear()
  const max = cases.reduce((m, c) => Math.max(m, Number(c.no.split('-')[2])), 0)
  return `KSS-${year}-${String(max + 1).padStart(4, '0')}`
}

export default function CaseModal({ kase, onClose, onSaved }) {
  const { state, actions } = useStore()
  const editing = !!kase
  const [no] = useState(kase?.no ?? nextCaseNo(state.cases))
  const [title, setTitle] = useState(kase?.title ?? '')
  const [description, setDescription] = useState(kase?.description ?? '')
  const [status, setStatus] = useState(kase?.status ?? 'Penyidikan')

  const submit = (e) => {
    e.preventDefault()
    actions.saveCase({ no, title: title.trim(), description: description.trim(), status })
    onSaved?.(no)
    onClose()
  }

  return (
    <ClipboardModal open onClose={onClose} title={editing ? 'Edit kasus' : 'Tambah kasus'} sub={editing ? no : null} width={editing ? 560 : 540}>
      <form className="modal-form" onSubmit={submit}>
        {!editing && (
          <div className="field">
            <label>Nomor kasus</label>
            <div className="input locked mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              {no}
              <Lock />
            </div>
          </div>
        )}
        <div className="field">
          <label>
            Judul kasus<span className="req">*</span>
          </label>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Deskripsi</label>
          <textarea className="input" rows={editing ? 6 : 4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label>Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Penyidikan</option>
            <option>Pemberkasan</option>
            <option>Selesai</option>
          </select>
        </div>
        <span className="hint" style={{ fontSize: 13 }}>
          <Database /> Disimpan di database, tanpa transaksi blockchain
        </span>
        <ClipFoot>
          <button type="button" className="btn btn-text btn-lg" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-green btn-lg">{editing ? 'Simpan perubahan' : 'Simpan kasus'}</button>
        </ClipFoot>
      </form>
    </ClipboardModal>
  )
}
