import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../store/AppStore'
import { CONTRACT, wait } from '../lib/chain'
import { initials, shortAddr } from '../lib/format'
import './popups.css'

export default function MetaMaskPopup() {
  const { pendingTx, closeTx, me } = useStore()
  const [sending, setSending] = useState(false)

  if (!pendingTx) return null

  const account = pendingTx.account ?? me
  const confirm = async () => {
    setSending(true)
    await wait(900)
    setSending(false)
    closeTx(true)
  }

  return createPortal(
    <div className="overlay overlay-top">
      <div className="mm" role="dialog" aria-label="Konfirmasi MetaMask">
        <div className="mm-head">
          <span className="mm-brand">
            <svg width="30" height="30" viewBox="0 0 44 44">
              <rect width="44" height="44" rx="12" fill="#F5841F" />
              <rect x="11" y="14" width="22" height="17" rx="4" stroke="#FFF" strokeWidth="2.4" fill="none" />
              <path d="M11 19H33" stroke="#FFF" strokeWidth="2.4" />
              <circle cx="28" cy="25" r="2" fill="#FFF" />
            </svg>
            MetaMask
          </span>
          <span className="sticker">
            <span className="dot" style={{ background: 'var(--green)' }} />
            {CONTRACT.network}
          </span>
        </div>
        <div className="mm-body">
          {account && (
            <div className="mm-account">
              <span className="avatar me" style={{ width: 34, height: 34 }}>
                {initials(account.name)}
              </span>
              <div>
                <b>{account.name}</b>
                <span className="mono muted">{shortAddr(account.wallet)}</span>
              </div>
            </div>
          )}
          <div>
            <h3>{pendingTx.kind === 'sign' ? 'Permintaan tanda tangan' : 'Konfirmasi transaksi'}</h3>
            <p className="muted">evichain.app meminta Anda {pendingTx.kind === 'sign' ? 'menandatangani pesan' : 'mengirim transaksi'}</p>
          </div>
          <dl className="mm-table">
            <div>
              <dt>Kontrak</dt>
              <dd className="mono">
                {CONTRACT.name} {shortAddr(CONTRACT.address)}
              </dd>
            </div>
            <div>
              <dt>Fungsi</dt>
              <dd className="mono">{pendingTx.fn}</dd>
            </div>
            <div>
              <dt>Parameter</dt>
              <dd>{pendingTx.params}</dd>
            </div>
            <div>
              <dt>Estimasi gas</dt>
              <dd>{pendingTx.gas ?? '0,00021'} SepoliaETH</dd>
            </div>
          </dl>
          <div className="mm-actions">
            <button className="btn btn-paper btn-lg" onClick={() => closeTx(false)} disabled={sending}>
              Tolak
            </button>
            <button className="btn btn-green btn-lg" onClick={confirm} disabled={sending}>
              {sending ? 'Menunggu blok…' : 'Konfirmasi'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
