import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store/AppStore'
import { ROLE_COLOR, formatBlock, shortAddr } from '../../lib/format'
import { nextBlock, randomTx } from '../../lib/chain'
import IdCard from '../../components/IdCard'
import ClipboardModal, { ClipFoot } from '../../components/Clipboard'
import { Info, Lock, Pencil, Search, Trash } from '../../components/Icons'
import './admin.css'

const ROLES = ['Admin', 'Penyidik', 'Analis', 'Auditor']
const tilts = [0.8, -0.6, 0.5, -0.8, 0.6, -0.5, 0.4, -0.7]
const isWallet = (w) => /^0x[0-9a-fA-F]{40}$/.test(w.trim())

function useChainReceipt() {
  const { state, notify } = useStore()
  return (body) => {
    const last = state.events.reduce((m, e) => Math.max(m, e.block), 0)
    notify({ title: `Tercatat di blok ${formatBlock(nextBlock(last))}`, body, tx: randomTx() })
  }
}

function UserModal({ user, onClose }) {
  const { state, actions, requestTx, notify } = useStore()
  const receipt = useChainReceipt()
  const editing = !!user
  const [form, setForm] = useState(
    user ?? { name: '', role: 'Analis', wallet: '', nip: '', unit: '', email: '' },
  )
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const taken = !editing && state.users.some((u) => u.wallet.toLowerCase() === form.wallet.trim().toLowerCase())
  const walletOk = editing || (isWallet(form.wallet) && !taken)
  const roleChanged = editing && form.role !== user.role

  const submit = async (e) => {
    e.preventDefault()
    if (!walletOk) return
    const data = { ...form, name: form.name.trim(), wallet: form.wallet.trim(), email: form.email.trim() }
    onClose()

    if (!editing || roleChanged) {
      const fn = editing ? 'revokeRole() lalu grantRole()' : 'grantRole()'
      const ok = await requestTx({ fn, params: `${data.role} untuk ${shortAddr(data.wallet)}` })
      if (!ok) return
      const id = user?.id ?? data.email.split('@')[0].split('.')[0] + Date.now().toString(36).slice(-3)
      actions.saveUser({ ...data, id })
      receipt(editing ? `Role ${data.name} menjadi ${data.role}` : `${data.name} terdaftar sebagai ${data.role}`)
      return
    }

    actions.saveUser(data)
    notify({ title: 'Profil pengguna tersimpan', body: data.name })
  }

  return (
    <ClipboardModal open onClose={onClose} title={editing ? 'Edit pengguna' : 'Tambah pengguna'} width={600}>
      <form className="modal-form" onSubmit={submit} style={{ gap: 18 }}>
        <div className="row-2">
          <div className="field">
            <label>
              Nama lengkap<span className="req">*</span>
            </label>
            <input className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label>
              Role on-chain<span className="req">*</span>
            </label>
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>
            Alamat wallet<span className="req">*</span>
          </label>
          {editing ? (
            <div className="input locked mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              {form.wallet}
              <Lock />
            </div>
          ) : (
            <>
              <input className="input mono" style={{ fontSize: 13 }} required value={form.wallet} onChange={set('wallet')} placeholder="0x…" />
              {form.wallet && !isWallet(form.wallet) && <span className="hint" style={{ color: 'var(--red)' }}>Alamat harus 0x diikuti 40 karakter heksadesimal</span>}
              {taken && <span className="hint" style={{ color: 'var(--red)' }}>Wallet ini sudah terdaftar</span>}
            </>
          )}
        </div>
        <div className="row-2">
          <div className="field">
            <label>NIP</label>
            <input className="input mono" value={form.nip} onChange={set('nip')} />
          </div>
          <div className="field">
            <label>Unit kerja</label>
            <input className="input" value={form.unit} onChange={set('unit')} />
          </div>
        </div>
        <div className="field">
          <label>
            Email<span className="req">*</span>
          </label>
          <input className="input" type="email" required value={form.email} onChange={set('email')} />
        </div>
        {editing ? (
          <div className="note warn">
            <Info color="var(--amber-ink)" />
            <span>Wallet tidak bisa diubah. Mengganti role memerlukan revokeRole lalu grantRole.</span>
          </div>
        ) : (
          <div className="note info">
            <Info color="var(--desk)" />
            <span>Role diberikan lewat transaksi grantRole dari wallet Admin.</span>
          </div>
        )}
        <ClipFoot>
          <button type="button" className="btn btn-text btn-lg" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-green btn-lg" disabled={!walletOk}>
            {editing ? 'Simpan' : 'Simpan dan grantRole'}
          </button>
        </ClipFoot>
      </form>
    </ClipboardModal>
  )
}

function DeleteModal({ user, onClose }) {
  const { actions, requestTx } = useStore()
  const receipt = useChainReceipt()

  const remove = async () => {
    onClose()
    const ok = await requestTx({ fn: 'revokeRole()', params: `${user.role} dari ${shortAddr(user.wallet)}` })
    if (!ok) return
    actions.removeUser(user.id)
    receipt(`Role ${user.name} dicabut`)
  }

  return (
    <ClipboardModal open onClose={onClose} title="Hapus pengguna" width={500}>
      <div className="revoke-art">
        <IdCard user={user} variant="flat" tilt={-3} />
        <span className="revoke-stamp">Role dicabut</span>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: '#3d382c' }}>
        Role {user.role} {user.name} dicabut lewat revokeRole dan profilnya dihapus dari database.
      </p>
      <div className="note danger">
        <Info color="var(--red)" />
        <span>Riwayat aktivitas {user.name.split(' ')[0]} di blockchain tetap tersimpan dan tidak ikut terhapus.</span>
      </div>
      <ClipFoot>
        <button className="btn btn-text btn-lg" onClick={onClose}>
          Batal
        </button>
        <button className="btn btn-red btn-lg" onClick={remove}>
          Cabut role dan hapus
        </button>
      </ClipFoot>
    </ClipboardModal>
  )
}

export default function Users() {
  const { state, me } = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [role, setRole] = useState(null)
  const [modal, setModal] = useState(location.state?.add ? { type: 'add' } : null)

  const q = query.trim().toLowerCase()
  const list = state.users.filter(
    (u) => (!role || u.role === role) && (!q || `${u.name} ${u.unit} ${u.wallet} ${u.email}`.toLowerCase().includes(q)),
  )
  const holding = (id) => state.evidence.filter((e) => e.holder === id && e.status !== 'Voided').length

  const close = () => {
    setModal(null)
    if (location.state) navigate('.', { replace: true, state: null })
  }

  return (
    <>
      <div className="page-head">
        <h1>Pengguna</h1>
        <button className="btn btn-red" onClick={() => setModal({ type: 'add' })}>
          Tambah pengguna
        </button>
      </div>

      <div className="toolbar">
        <label className="search" style={{ width: 340 }}>
          <Search />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, unit, atau wallet" />
        </label>
        <div className="chip-row">
          <button className={`chip ${!role ? 'on' : ''}`} onClick={() => setRole(null)}>
            Semua <span className="n">{state.users.length}</span>
          </button>
          {ROLES.map((r) => {
            const n = state.users.filter((u) => u.role === r).length
            return (
              <button key={r} className={`chip ${role === r ? 'on' : ''} ${n ? '' : 'zero'}`} onClick={() => setRole(role === r ? null : r)} style={{ paddingLeft: 11 }}>
                <span className="dot" style={{ background: ROLE_COLOR[r] }} />
                {r} <span className="n">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="id-grid">
        {list.map((u, i) => {
          const held = holding(u.id)
          return (
            <IdCard
              key={u.id}
              user={u}
              variant="full"
              isMe={u.id === me.id}
              held={held}
              tilt={tilts[i % tilts.length]}
              actions={
                <>
                  <button className="icon-btn" title="Edit" onClick={() => setModal({ type: 'edit', user: u })}>
                    <Pencil />
                  </button>
                  {u.id !== me.id && (
                    <button
                      className="icon-btn danger"
                      title={held ? 'Masih memegang barang bukti' : 'Hapus'}
                      disabled={held > 0}
                      style={held ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                      onClick={() => setModal({ type: 'delete', user: u })}
                    >
                      <Trash />
                    </button>
                  )}
                </>
              }
            />
          )
        })}
      </div>
      {!list.length && <p className="empty-desk">Tidak ada pengguna yang cocok.</p>}

      {modal?.type === 'add' && <UserModal onClose={close} />}
      {modal?.type === 'edit' && <UserModal user={modal.user} onClose={close} />}
      {modal?.type === 'delete' && <DeleteModal user={modal.user} onClose={close} />}
    </>
  )
}
