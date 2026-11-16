import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/AppStore'
import { walletAccounts } from '../data/seed'
import { siweMessage, wait } from '../lib/chain'
import { ROLE_COLOR, initials, shortAddr } from '../lib/format'
import { Board, ClipFoot } from '../components/Clipboard'
import { Check, ChevronLeft, ChevronRight, Lock } from '../components/Icons'
import { RoleChip } from '../components/Status'
import './login.css'

const STEPS = ['Hubungkan', 'Pilih akun', 'Tanda tangan']

function Steps({ active }) {
  return (
    <div className="steps">
      {STEPS.map((label, i) => (
        <div key={label} className="steps-item">
          <span className={`steps-dot ${i < active ? 'done' : i === active ? 'now' : ''}`}>
            {i < active ? <Check /> : i + 1}
          </span>
          <span className={i <= active ? 'on' : ''}>{label}</span>
          {i < STEPS.length - 1 && <span className={`steps-line ${i < active ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  )
}

export default function Login() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState(walletAccounts[1])
  const [signing, setSigning] = useState(false)

  const accounts = useMemo(
    () =>
      walletAccounts.map((wallet, i) => ({
        wallet,
        label: i < walletAccounts.length - 1 ? `Akun ${i + 1}` : 'Akun baru',
        user: state.users.find((u) => u.wallet === wallet),
      })),
    [state.users],
  )

  const current = accounts.find((a) => a.wallet === picked)
  const message = useMemo(() => siweMessage(picked), [picked, step])

  const sign = async () => {
    setSigning(true)
    await wait(700)
    setSigning(false)
    if (!current.user) {
      setStep(3)
      return
    }
    actions.login(current.user.id)
    navigate(current.user.role === 'Admin' ? '/admin' : '/')
  }

  return (
    <div className="login">
      <header className="login-top">
        <span className="brand light">
          <svg width="30" height="30" viewBox="0 0 28 28">
            <rect width="28" height="28" rx="8" fill="#F6F1E4" />
            <rect x="5.5" y="9.5" width="10.5" height="9" rx="4.5" stroke="#0F4A3C" strokeWidth="2" fill="none" />
            <rect x="12" y="9.5" width="10.5" height="9" rx="4.5" stroke="#E8452C" strokeWidth="2" fill="none" />
          </svg>
          evichain
        </span>
        <Link to="/" className="login-home">
          <ChevronLeft /> Beranda
        </Link>
      </header>

      <div className="login-center">
        {step === 0 && (
          <Board width={520}>
            <Steps active={0} />
            <div className="login-head">
              <h1>Masuk dengan wallet</h1>
              <p>Identitas Anda dibuktikan lewat tanda tangan wallet, bukan password.</p>
            </div>
            <div className="wallets">
              <button className="wallet on" onClick={() => setStep(1)}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <rect width="44" height="44" rx="12" fill="#F5841F" />
                  <rect x="11" y="14" width="22" height="17" rx="4" stroke="#FFF" strokeWidth="2" fill="none" />
                  <path d="M11 19H33" stroke="#FFF" strokeWidth="2" />
                  <circle cx="28" cy="25" r="1.8" fill="#FFF" />
                </svg>
                <span className="wallet-text">
                  <b>MetaMask</b>
                  <span>Ekstensi browser</span>
                </span>
                <span className="found">
                  <span className="dot" style={{ background: 'var(--green)' }} />
                  Terdeteksi
                </span>
              </button>
              <button className="wallet" disabled title="Belum tersedia di versi ini">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="#FFF" strokeWidth="2">
                  <rect width="44" height="44" rx="12" fill="#3B6FE0" stroke="none" />
                  <rect x="12" y="12" width="8" height="8" rx="2" />
                  <rect x="24" y="12" width="8" height="8" rx="2" />
                  <rect x="12" y="24" width="8" height="8" rx="2" />
                  <path d="M25 25H31M25 30H28M31 28V32" strokeLinecap="round" />
                </svg>
                <span className="wallet-text">
                  <b>WalletConnect</b>
                  <span>Wallet di ponsel</span>
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
            <p className="login-note">Belum punya role? Minta Admin mendaftarkan wallet Anda.</p>
          </Board>
        )}

        {step === 1 && (
          <Board width={560}>
            <Steps active={1} />
            <div className="login-head">
              <h1>Pilih akun</h1>
            </div>
            <div className="accounts" role="radiogroup">
              {accounts.map((a) => {
                const role = a.user?.role
                return (
                  <label key={a.wallet} className={`account ${picked === a.wallet ? 'on' : ''} ${role ? '' : 'new'}`}>
                    <input
                      type="radio"
                      name="account"
                      checked={picked === a.wallet}
                      onChange={() => setPicked(a.wallet)}
                    />
                    <span className="radio" />
                    <span className="band" style={{ background: role ? ROLE_COLOR[role] : 'var(--void)' }} />
                    <span className="account-text">
                      <b>{a.label}</b>
                      <span className="mono">{shortAddr(a.wallet)}</span>
                    </span>
                    {role ? (
                      <RoleChip role={role} tone="light" />
                    ) : (
                      <span className="role-chip light">
                        <span className="dot" style={{ background: 'var(--void)', width: 6, height: 6 }} />
                        Belum terdaftar
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
            <ClipFoot>
              <button className="btn btn-text btn-lg" onClick={() => setStep(0)} style={{ marginRight: 'auto' }}>
                Kembali
              </button>
              <button className="btn btn-green btn-lg" onClick={() => setStep(2)}>
                Lanjutkan
              </button>
            </ClipFoot>
          </Board>
        )}

        {step === 2 && (
          <Board width={560}>
            <Steps active={2} />
            <div className="login-head">
              <h1>Tanda tangani pesan</h1>
              <p>Ini bukan transaksi dan tidak memakai gas.</p>
            </div>
            <div className="signer">
              <span className="avatar me" style={{ width: 38, height: 38, fontSize: 13 }}>
                {current.user ? initials(current.user.name) : '?'}
              </span>
              <span className="account-text">
                <b>{current.user?.name ?? current.label}</b>
                <span className="mono">{shortAddr(current.wallet)}</span>
              </span>
              {current.user && <RoleChip role={current.user.role} tone="light" />}
            </div>
            <pre className="siwe mono">{message}</pre>
            <span className="hint">
              <Lock /> Nonce sekali pakai, kedaluwarsa dalam 5 menit
            </span>
            <ClipFoot>
              <button className="btn btn-paper btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Tolak
              </button>
              <button className="btn btn-green btn-lg" style={{ flex: 1 }} onClick={sign} disabled={signing}>
                {signing ? 'Menunggu MetaMask…' : 'Tanda tangani'}
              </button>
            </ClipFoot>
          </Board>
        )}

        {step === 3 && (
          <Board width={520}>
            <Steps active={2} />
            <div className="no-role">
              <div className="no-role-card">
                <div className="no-role-band">
                  <b>evichain</b>
                  <i />
                </div>
                <div className="no-role-body">
                  <svg width="62" height="72" viewBox="0 0 62 72">
                    <rect width="62" height="72" rx="8" fill="#E7DEC8" />
                    <circle cx="31" cy="28" r="11" fill="#C9BC9C" />
                    <path d="M12 64C12 52 20 46 31 46C42 46 50 52 50 64" fill="#C9BC9C" />
                  </svg>
                  <div>
                    <b>Akun baru</b>
                    <span className="mono">{shortAddr(current.wallet)}</span>
                    <small>Role</small>
                    <strong>Tidak ada</strong>
                  </div>
                </div>
              </div>
              <span className="no-role-stamp">Belum terdaftar</span>
            </div>
            <div className="login-head">
              <h1>Wallet belum terdaftar</h1>
              <p>
                Tanda tangan valid, tapi {shortAddr(current.wallet)} belum punya role di smart contract. Minta Admin
                mendaftarkannya lewat halaman Pengguna.
              </p>
            </div>
            <ClipFoot>
              <button className="btn btn-paper btn-lg" style={{ flex: 1 }} onClick={() => setStep(0)}>
                Ke beranda
              </button>
              <button className="btn btn-green btn-lg" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Pilih akun lain
              </button>
            </ClipFoot>
          </Board>
        )}
      </div>
    </div>
  )
}
