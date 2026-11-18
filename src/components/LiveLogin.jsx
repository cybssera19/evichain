import { Board } from './Clipboard'
import { Logo } from './Icons'
import '../pages/login.css'

export default function LiveLogin({
  login,
  addNetwork,
  busy,
  chainId,
  walletStatus,
  notice,
  error,
}) {
  return (
    <div className="login live-login">
      <header className="login-top">
        <span className="brand light">
          <Logo />
          evichain
        </span>
      </header>
      <div className="login-center">
        <Board width={520}>
          <div className="steps">
            {['Connect', 'Select account', 'Sign message'].map((label, i) => (
              <div className="steps-item" key={label}>
                <span className={`steps-dot ${i === 0 ? 'now' : ''}`}>{i + 1}</span>
                <span className={i === 0 ? 'on' : ''}>{label}</span>
                {i < 2 && <span className="steps-line" />}
              </div>
            ))}
          </div>
          <div className="login-head">
            <h1>Sign in with your wallet</h1>
            <p>Use your wallet signature to verify your identity.</p>
          </div>
          <button type="button" className="wallet on live-wallet" onClick={login} disabled={busy}>
            <span className="wallet-icon">◆</span>
            <span className="wallet-text">
              <b>MetaMask</b>
              <span>{busy ? 'Awaiting confirmation…' : 'Connect your account'}</span>
            </span>
            <span className="found">Continue →</span>
          </button>
          {chainId === 31337 && (
            <button type="button" className="live-network" onClick={addNetwork}>
              Add / select local network (ID 31337)
            </button>
          )}
          {walletStatus && <p className="login-note">{walletStatus}</p>}
          {notice && <p className="notice">{notice}</p>}
          {error && <p className="error">{error}</p>}
          <p className="login-note">
            New here? Register after signing in. Signing in does not cost gas.
          </p>
        </Board>
      </div>
    </div>
  )
}
