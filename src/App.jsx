import { useCallback, useEffect, useRef, useState } from 'react'
import { ethers } from 'ethers'
import { errorMessage } from './lib/errors'
import { caseAbi, caseStages, canonicalCase, caseHash } from '../shared/cases'
import { abi, roleAbi, roles, statuses, short } from './lib/registry'
import { Logo, Search } from './components/Icons'
import Ledger from './components/Ledger'
import { StatusStamp } from './components/Status'
import { LiveFolder, LiveRecent, Today } from './components/LiveDesk'
import LiveLogin from './components/LiveLogin'
import CaseDetail from './components/CaseDetail'
import AdminDash from './components/AdminDash'
import ActivityLog from './components/ActivityLog'
import UserManager from './components/UserManager'
import Profile from './components/Profile'
import Receipt from './components/Receipt'
import { RowTag } from './components/Tags'
import { STATUS } from './lib/format'
import './styles/base.css'
import './components/nav.css'
import './components/ledger.css'
import './components/clipboard.css'
import './styles/app.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'
const ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const ROLE_ADDRESS = import.meta.env.VITE_ROLE_CONTRACT_ADDRESS
const RPC = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545'
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 31337)
const sha = async (file) =>
  '0x' +
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
const form = (event) => Object.fromEntries(new FormData(event.currentTarget))
async function api(path, method = 'GET', data, quietAuth = false) {
  const response = await fetch(`${API}/api${path}`, {
    method,
    credentials: 'include',
    headers: data instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    body: data ? (data instanceof FormData ? data : JSON.stringify(data)) : undefined,
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (!quietAuth && response.status === 401 && !path.startsWith('/auth/'))
      window.dispatchEvent(new Event('evichain:session-expired'))
    throw Object.assign(new Error(result.code || 'REQUEST_FAILED'), {
      safeMessage: result.error || 'Request failed. Please try again.',
      status: response.status,
    })
  }
  return result
}
const fmtDate = (s) => new Date(Number(s) * 1000).toLocaleString('en-US')
const normalize = (e) => ({
  id: Number(e.id),
  caseId: e.caseId,
  kind: e.kind,
  fileHash: e.fileHash,
  holder: e.holder,
  status: statuses[Number(e.status)],
  creator: e.creator,
  createdAt: Number(e.createdAt),
})
const injectedWallet = () =>
  window.ethereum?.providers?.find((provider) => provider.isMetaMask) || window.ethereum
const errorCode = (error) => (error?.code === 'UNKNOWN_ERROR' ? error?.error?.code : error?.code)
function Field({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  )
}
function Info({ label, value }) {
  return (
    <div className="info">
      <span className="muted">{label}</span>
      <b>{value}</b>
    </div>
  )
}

export default function App() {
  const [me, setMe] = useState(null)
  const [screen, setScreen] = useState('Dashboard')
  const [users, setUsers] = useState([])
  const [cases, setCases] = useState([])
  const [evidence, setEvidence] = useState([])
  const [files, setFiles] = useState([])
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)
  const [regReceipt, setRegReceipt] = useState(null)
  const [verifyLog, setVerifyLog] = useState([])
  const [walletStatus, setWalletStatus] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const walletError = errorMessage
  const authEpoch = useRef(0)
  const signingWallet = useRef(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const clearSession = useCallback(() => {
    authEpoch.current++
    setMe(null)
    setScreen('Dashboard')
    setUsers([])
    setCases([])
    setEvidence([])
    setFiles([])
    setSelected(null)
    setHistory([])
    setVerifyResult(null)
    setNotice('')
    setWalletStatus('')
    setSelectedCase(null)
    setRegReceipt(null)
    setVerifyLog([])
  }, [])
  const logout = async () => {
    try {
      await api('/auth/logout', 'POST')
      clearSession()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const read = useCallback(
    () => new ethers.Contract(ADDRESS, abi, new ethers.JsonRpcProvider(RPC)),
    [],
  )
  const refresh = useCallback(async () => {
    const epoch = authEpoch.current
    const chain = read()
    const count = Number(await chain.nextId())
    const [u, c, f, e] = await Promise.all([
      api('/users'),
      api('/cases'),
      api('/evidence/files'),
      Promise.all(
        Array.from({ length: count - 1 }, (_, i) => chain.getEvidence(i + 1).then(normalize)),
      ),
    ])
    if (epoch !== authEpoch.current) return
    setUsers(u)
    setCases(c)
    setFiles(f)
    setEvidence(e.reverse())
  }, [read])
  useEffect(() => {
    let active = true
    const epoch = authEpoch.current
    api('/me', 'GET', undefined, true)
      .then((data) => {
        if (active && epoch === authEpoch.current) setMe(data)
      })
      .catch((e) => {
        if (active && e.status !== 401) setError(errorMessage(e))
      })
      .finally(() => {
        if (active) setCheckingSession(false)
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    const changed = () => {
      if (!me && !signingWallet.current) return
      clearSession()
      setError('Your wallet account or network changed. Please sign in again.')
      api('/auth/logout', 'POST').catch(() => {})
    }
    const expired = () => {
      clearSession()
      setError('Your session has expired. Please sign in again.')
    }
    const injected = injectedWallet()
    injected?.on?.('accountsChanged', changed)
    injected?.on?.('chainChanged', changed)
    injected?.on?.('disconnect', changed)
    window.addEventListener('evichain:session-expired', expired)
    return () => {
      injected?.removeListener?.('accountsChanged', changed)
      injected?.removeListener?.('chainChanged', changed)
      injected?.removeListener?.('disconnect', changed)
      window.removeEventListener('evichain:session-expired', expired)
    }
  }, [clearSession, me])
  useEffect(() => {
    if (!me) return
    let active = true
    const check = async () => {
      try {
        const injected = injectedWallet()
        if (injected) {
          const accounts = await injected.request({ method: 'eth_accounts' })
          const chain = await injected.request({ method: 'eth_chainId' })
          if (
            !accounts[0] ||
            accounts[0].toLowerCase() !== me.wallet.toLowerCase() ||
            Number(chain) !== CHAIN_ID
          ) {
            if (active) {
              clearSession()
              setError('Your wallet account or network changed. Please sign in again.')
              await api('/auth/logout', 'POST')
            }
            return
          }
        }
        const current = await api('/me')
        if (active && current.role !== me.role) {
          setMe(current)
          setScreen('Dashboard')
        }
      } catch (e) {
        if (active && e.status !== 401) setError(errorMessage(e))
      }
    }
    check()
    window.addEventListener('focus', check)
    const timer = setInterval(check, 60000)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', check)
    }
  }, [me, clearSession])
  useEffect(() => {
    if (me && me.role !== 'None') refresh().catch((e) => setError(errorMessage(e)))
  }, [me, refresh])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(t)
  }, [notice])
  useEffect(() => {
    if (selected && ADDRESS)
      read()
        .getCustodyHistory(selected)
        .then((rows) =>
          setHistory(
            rows.map((r) => ({
              actor: r.actor,
              from: r.from,
              to: r.to,
              action: r.action,
              note: r.note,
              reportHash: r.reportHash,
              at: Number(r[6]),
            })),
          ),
        )
        .catch((e) => setError(errorMessage(e)))
  }, [selected, evidence, read])
  useEffect(() => {
    setVerifyResult(null)
  }, [screen])
  const wallet = async () => {
    const injected = injectedWallet()
    if (!injected)
      throw new Error(
        'MetaMask was not found. Open this page in Chrome or Edge with the extension enabled.',
      )
    const accounts = await injected.request({ method: 'eth_requestAccounts' })
    if (!accounts?.length) throw new Error('Select an account in MetaMask to connect to EviChain.')
    const provider = new ethers.BrowserProvider(injected)
    const signer = await provider.getSigner(accounts[0])
    const currentChain = Number((await provider.getNetwork()).chainId)
    const currentAddress = await signer.getAddress()
    setWalletStatus(`Wallet ${short(currentAddress)}  Chain ${currentChain}`)
    if (currentChain !== CHAIN_ID)
      throw new Error(
        `MetaMask is on chain ${currentChain}. Select EviChain Local (chain ${CHAIN_ID}).`,
      )
    if (me && (await signer.getAddress()).toLowerCase() !== me.wallet.toLowerCase())
      throw new Error('Select the wallet used to sign in')
    return signer
  }
  const addNetwork = async () => {
    setError('')
    try {
      const injected = injectedWallet()
      if (!injected) throw new Error('MetaMask is not available')
      const hexId = '0x' + CHAIN_ID.toString(16)
      try {
        await injected.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexId }],
        })
      } catch (switchError) {
        if (switchError.code !== 4902) throw switchError
        await injected.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexId,
              chainName: 'EviChain Local',
              rpcUrls: [RPC],
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            },
          ],
        })
      }
      setNotice('EviChain Local is ready')
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const login = async () => {
    if (busy) return
    const epoch = authEpoch.current
    setBusy(true)
    setError('')
    setNotice('')
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const signer = await wallet()
        if (epoch !== authEpoch.current) return
        signingWallet.current = true
        const address = await signer.getAddress()
        const challenge = await api('/auth/nonce', 'POST', { wallet: address })
        const message = challenge.message
        let signature
        try {
          signature = await injectedWallet().request({
            method: 'personal_sign',
            params: [ethers.hexlify(ethers.toUtf8Bytes(message)), address],
          })
        } catch (signError) {
          if (errorCode(signError) !== 4100 || attempt === 1) throw signError
          await injectedWallet().request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }],
          })
          continue
        }
        if (epoch !== authEpoch.current) return
        const result = await api('/auth/verify', 'POST', { message, signature })
        if (epoch !== authEpoch.current) {
          await api('/auth/logout', 'POST')
          return
        }
        setScreen('Dashboard')
        setMe(result)
        return
      }
    } catch (e) {
      setError(walletError(e))
    } finally {
      signingWallet.current = false
      setBusy(false)
    }
  }
  const tx = async (label, send, useRoles = false) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const signer = await wallet()
      const target =
        useRoles === 'cases' ? await read().caseRegistry() : useRoles ? ROLE_ADDRESS : ADDRESS
      const contract = new ethers.Contract(
        target,
        useRoles === 'cases' ? caseAbi : useRoles ? roleAbi : abi,
        signer,
      )
      const pending = await send(contract)
      setNotice(`${label}: awaiting confirmation ${short(pending.hash)}`)
      const receipt = await pending.wait()
      if (receipt.status !== 1) throw new Error('Transaction failed')
      try {
        await refresh()
      } catch (e) {
        setError(`The transaction succeeded, but the page could not refresh. ${errorMessage(e)}`)
      }
      setNotice(`${label} recorded in block ${receipt.blockNumber}. Tx ${pending.hash}`)
      return receipt
    } catch (e) {
      setError(walletError(e))
      return null
    } finally {
      setBusy(false)
    }
  }
  const saveCase = async (event) => {
    event.preventDefault()
    const node = event.currentTarget,
      data = canonicalCase(form(event))
    try {
      const chain = new ethers.Contract(
        await read().caseRegistry(),
        caseAbi,
        new ethers.JsonRpcProvider(RPC),
      )
      const record = await chain.getCase(data.no)
      const hash = caseHash(data),
        stage = caseStages.indexOf(data.status)
      if (!record.exists || Number(record.stage) !== stage || record.metadataHash !== hash) {
        if (!(await tx('Case updated', (c) => c.setCase(data.no, stage, hash), 'cases'))) return
      }
      await api('/cases', 'POST', data)
      await refresh()
      setNotice('Case saved and verified against the blockchain')
      node.reset()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const deleteCase = async (no) => {
    try {
      const chain = new ethers.Contract(
        await read().caseRegistry(),
        caseAbi,
        new ethers.JsonRpcProvider(RPC),
      )
      const record = await chain.getCase(no)
      if (
        Number(record.stage) !== 3 &&
        !(await tx('Case deleted', (c) => c.deleteCase(no), 'cases'))
      )
        return
      await api('/cases/' + encodeURIComponent(no), 'DELETE')
      await refresh()
      setNotice('Case deleted. This case ID cannot be reused.')
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const signUp = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const epoch = authEpoch.current
    try {
      const result = await api('/register', 'POST', form(event))
      if (epoch !== authEpoch.current) return
      setMe(result)
      setNotice('Registration submitted. An Admin must approve your role.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const saveUser = async (event) => {
    event.preventDefault()
    const node = event.currentTarget
    const data = form(event)
    try {
      const current = Number(await read().roles(data.wallet))
      if (
        current !== roles.indexOf(data.role) &&
        !(await tx('Role assigned', (c) => c.setRole(data.wallet, roles.indexOf(data.role)), true))
      )
        return
    } catch (e) {
      setError(walletError(e))
      return
    }
    try {
      await api('/users', 'POST', data)
      await refresh()
      node.reset()
    } catch (e) {
      setError(`The role was updated, but the profile could not be saved. ${errorMessage(e)}`)
    }
  }
  const register = async (event) => {
    event.preventDefault()
    const data = form(event)
    const file = data.file
    const fileHash = await sha(file)
    const txReceipt = await tx('Evidence registered', async (c) =>
      c.registerEvidence(data.caseId, data.kind, fileHash),
    )
    if (!txReceipt) return
    const iface = new ethers.Interface(abi)
    const change = txReceipt.logs
      .map((l) => {
        try {
          return iface.parseLog(l)
        } catch {
          return null
        }
      })
      .find((l) => l?.name === 'EvidenceChanged')
    const id = Number(change?.args.id)
    if (!id)
      return setError('The transaction succeeded, but its receipt did not include an evidence ID.')
    const body = new FormData()
    body.append('file', file)
    let uploaded = ''
    try {
      await api(`/evidence/${id}/file`, 'POST', body)
      uploaded = file.name
      await refresh()
    } catch (e) {
      setError(`Evidence #${id} was registered, but the file upload failed. ${errorMessage(e)}`)
    }
    setRegReceipt({
      id,
      kind: data.kind,
      caseId: data.caseId,
      hash: fileHash,
      block: txReceipt.blockNumber,
      tx: txReceipt.hash,
      file: uploaded,
      at: new Date().toISOString(),
    })
    setSelected(id)
    setScreen('Receipt')
  }
  const item = evidence.find((e) => e.id === selected)
  const kase = cases.find((c) => c.no === selectedCase)
  const openEvidence = (id) => {
    setSelected(id)
    setScreen('Evidence details')
  }
  const openCase = (no) => {
    setSelectedCase(no)
    setScreen('Case details')
  }
  const name = (address) => {
    const u = users.find((u) => u.wallet.toLowerCase() === address?.toLowerCase())
    if (!u) return short(address)
    const hasDupe = users.filter((x) => x.name === u.name).length > 1
    if (hasDupe) return u.nip ? `${u.name} [${u.nip}]` : `${u.name} [${short(u.wallet)}]`
    return u.name
  }
  const holding =
    item &&
    item.holder.toLowerCase() === me?.wallet.toLowerCase() &&
    !['Voided', 'Released', 'Disposed'].includes(item.status)
  const nav = [
    'Dashboard',
    'Evidence',
    'Cases',
    'Verification',
    ...(me?.role === 'Admin' ? ['Users', 'Activity log'] : []),
    'Profile',
  ]
  if (!ADDRESS || !ROLE_ADDRESS)
    return (
      <div className="login">
        <section className="panel">
          <h1>EviChain</h1>
          <p>
            Contract addresses are not configured. Run <code>npm run start:local</code> or set both
            contract addresses in <code>.env</code>.
          </p>
        </section>
      </div>
    )
  if (checkingSession)
    return (
      <div className="login">
        <p style={{ color: 'var(--cream)' }}>Checking session…</p>
      </div>
    )
  if (!me)
    return (
      <LiveLogin
        login={login}
        addNetwork={addNetwork}
        busy={busy}
        chainId={CHAIN_ID}
        walletStatus={walletStatus}
        notice={notice}
        error={error}
      />
    )
  if (me.role === 'None')
    return (
      <div className="login">
        <section className="panel">
          <p className="eyebrow">User registration</p>
          <h1>{me.user ? 'Awaiting approval' : 'Complete your profile'}</h1>
          <p className="muted">
            Wallet {short(me.wallet)} is authenticated. An Admin must assign your role before you
            can access cases or evidence.
          </p>
          {!me.user && (
            <form onSubmit={signUp}>
              <Field label="Name">
                <input name="name" required maxLength={120} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" maxLength={254} />
              </Field>
              <Field label="Unit / organization">
                <input name="unit" maxLength={120} />
              </Field>
              <Field label="Requested role">
                <select name="requestedRole" required defaultValue="">
                  <option value="">Select a role</option>
                  <option value="Investigator">Investigator</option>
                  <option value="Analyst">Lab analyst</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </Field>
              <button disabled={busy}>Submit registration</button>
            </form>
          )}
          {me.user && (
            <p className="notice">
              Registration saved for {me.user.name}. Requested role: {me.user.requested_role}.
              Awaiting Admin approval.
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <button
            className="secondary"
            onClick={async () => {
              try {
                const result = await api('/me')
                setMe(result)
                if (result.role === 'None') setNotice('Your role has not been assigned yet.')
              } catch (e) {
                setError(errorMessage(e))
              }
            }}
          >
            Check status
          </button>
          <button className="quiet" onClick={logout}>
            Sign out
          </button>
          {notice && <p className="muted">{notice}</p>}
        </section>
      </div>
    )
  return (
    <div className="desk">
      <header className="nav live-nav">
        <b className="brand">
          <Logo />
          evichain
        </b>
        <div className="menu">
          {nav.map((n) => (
            <button key={n} className={screen === n ? 'active' : ''} onClick={() => setScreen(n)}>
              {n}
            </button>
          ))}
        </div>
        <div className="nav-right">
          <small className="nav-chip">
            {me.user?.name || short(me.wallet)}
            <span className="chip-sep" aria-hidden="true"></span>
            {me.role}
          </small>
          <button className="logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>
      <main className="page main">
        <div key={screen} className="page-fade">
          {(error || notice) && (
            <div className="toasts">
              {error && (
                <div className="toast error" role="alert">
                  <span>{error}</span>
                  <button
                    type="button"
                    className="toast-x"
                    onClick={() => setError('')}
                    aria-label="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              )}
              {notice && (
                <div className="toast notice" role="status">
                  <span>{notice}</span>
                  <button
                    type="button"
                    className="toast-x"
                    onClick={() => setNotice('')}
                    aria-label="Dismiss"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          )}
          {!['Case details', 'Receipt'].includes(screen) &&
            !(screen === 'Dashboard' && me.role === 'Admin') &&
            !(screen === 'Users' && me.role === 'Admin') &&
            !(screen === 'Activity log' && me.role === 'Admin') && (
              <div className="head">
                <div>
                  <Today />
                  <p className="eyebrow">{me.role}</p>
                  <h1>{screen}</h1>
                </div>
                {me.role === 'Investigator' &&
                  ['Dashboard', 'Evidence', 'Cases'].includes(screen) && (
                    <button onClick={() => setScreen('Register')}>+ Register evidence</button>
                  )}
              </div>
            )}
          {screen === 'Dashboard' && me.role === 'Admin' && (
            <AdminDash
              evidence={evidence}
              cases={cases}
              users={users}
              name={name}
              me={me}
              onOpenEvidence={openEvidence}
              onOpenCase={openCase}
              onManageUsers={() => setScreen('Users')}
              onOpenLog={() => setScreen('Activity log')}
            />
          )}
          {screen === 'Dashboard' && me.role !== 'Admin' && (
            <>
              <div className="section-title">
                <h2>
                  Active cases
                  <span className="count">
                    {cases.filter((c) => c.status !== 'Closed').length} cases
                  </span>
                </h2>
                <button className="section-link" onClick={() => setScreen('Cases')}>
                  View all
                </button>
              </div>
              <div className="drawer live-drawer">
                {cases
                  .filter((c) => c.status !== 'Closed')
                  .map((c) => (
                    <LiveFolder
                      key={c.no}
                      kase={c}
                      items={evidence.filter((e) => e.caseId === c.no)}
                      onOpen={(v) => (typeof v === 'number' ? openEvidence(v) : openCase(v))}
                    />
                  ))}
                {!cases.some((c) => c.status !== 'Closed') && (
                  <p className="empty-desk">No active cases.</p>
                )}
              </div>
              <div className="section-title live-section">
                <h2>Recent evidence</h2>
                <button className="section-link" onClick={() => setScreen('Evidence')}>
                  View all
                </button>
              </div>
              <LiveRecent
                items={evidence.slice(0, 4)}
                onOpen={(id) => {
                  setSelected(id)
                  setScreen('Evidence details')
                }}
              />
            </>
          )}
          {screen === 'Evidence' && (
            <>
              <div className="toolbar">
                <label className="search">
                  <Search />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by ID, evidence, case, or holder"
                  />
                </label>
                <div className="chip-row">
                  <button
                    className={`chip ${!statusFilter ? 'on' : ''}`}
                    onClick={() => setStatusFilter(null)}
                  >
                    All <span className="n">{evidence.length}</span>
                  </button>
                  {statuses.map((s) => (
                    <button
                      key={s}
                      className={`chip ${statusFilter === s ? 'on' : ''}`}
                      onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    >
                      {STATUS[s].label}{' '}
                      <span className="n">{evidence.filter((e) => e.status === s).length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <List
                items={evidence.filter(
                  (e) =>
                    (!statusFilter || e.status === statusFilter) &&
                    (!query.trim() ||
                      `#${e.id} ${e.kind} ${e.caseId} ${name(e.holder)}`
                        .toLowerCase()
                        .includes(query.trim().toLowerCase())),
                )}
                open={(id) => {
                  setSelected(id)
                  setScreen('Evidence details')
                }}
                name={name}
              />
            </>
          )}
          {screen === 'Register' && me.role === 'Investigator' && (
            <form className="panel form" onSubmit={register}>
              <p>
                The SHA-256 hash is calculated in your browser. The original file is stored
                privately on the server (25 MB maximum).
              </p>
              <Field label="Case">
                <select
                  name="caseId"
                  required
                  defaultValue={
                    selectedCase &&
                    cases.some((c) => c.no === selectedCase && c.status === 'Investigation')
                      ? selectedCase
                      : undefined
                  }
                >
                  {cases
                    .filter((c) => c.status === 'Investigation')
                    .map((c) => (
                      <option key={c.no} value={c.no}>
                        {c.no}: {c.title}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Evidence type">
                <input name="kind" required maxLength={80} />
              </Field>
              <Field label="Evidence file">
                <input name="file" type="file" required />
              </Field>
              <button disabled={busy || !cases.some((c) => c.status === 'Investigation')}>
                Register evidence
              </button>
            </form>
          )}
          {screen === 'Evidence details' && item && (
            <>
              <div className="grid">
                <section className="panel">
                  <h2>Evidence #{item.id}</h2>
                  <Info label="Type" value={item.kind} />
                  <Info label="Case" value={item.caseId} />
                  <Info label="Status" value={STATUS[item.status].label} />
                  <Info label="Holder" value={name(item.holder)} />
                  <Info label="Registered" value={fmtDate(item.createdAt)} />
                  <Info label="SHA-256" value={item.fileHash} />
                  <Info
                    label="Private file"
                    value={
                      files.find((f) => Number(f.evidence_id) === item.id)?.original_name ||
                      'Not uploaded'
                    }
                  />
                </section>
                <section className="panel">
                  <h2>Actions</h2>
                  {holding && (
                    <>
                      <form
                        className="section-form"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const d = form(e)
                          tx('Custody transferred', (c) => c.transferCustody(item.id, d.to, d.note))
                        }}
                      >
                        <Field label="Transfer to">
                          <select name="to">
                            {users
                              .filter(
                                (u) =>
                                  ['Investigator', 'Analyst'].includes(u.role) &&
                                  u.wallet.toLowerCase() !== me.wallet.toLowerCase(),
                              )
                              .map((u) => (
                                <option value={u.wallet} key={u.wallet}>
                                  {name(u.wallet)} ({u.role})
                                </option>
                              ))}
                          </select>
                        </Field>
                        <Field label="Reason">
                          <input name="note" required />
                        </Field>
                        <button disabled={busy}>Transfer</button>
                      </form>
                      {me.role === 'Investigator' && (
                        <form
                          className="section-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            const d = form(e)
                            tx('Metadata updated', (c) => c.updateEvidence(item.id, d.kind, d.note))
                          }}
                        >
                          <Field label="Update type">
                            <input name="kind" defaultValue={item.kind} required />
                          </Field>
                          <Field label="Notes">
                            <input name="note" />
                          </Field>
                          <button className="secondary" disabled={busy}>
                            Save metadata
                          </button>
                        </form>
                      )}
                      {me.role === 'Analyst' && (
                        <form
                          className="section-form"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            const d = form(e)
                            const hash = await sha(d.report)
                            tx('Analysis recorded', (c) => c.addAnalysis(item.id, hash, d.note))
                          }}
                        >
                          <Field label="Analysis report">
                            <input name="report" type="file" required />
                          </Field>
                          <Field label="Notes">
                            <input name="note" />
                          </Field>
                          <button className="secondary" disabled={busy}>
                            Record report hash
                          </button>
                        </form>
                      )}
                      {me.role === 'Investigator' && (
                        <form
                          className="section-form"
                          onSubmit={(e) => {
                            e.preventDefault()
                            const d = form(e)
                            tx('Status updated', (c) =>
                              c.updateStatus(item.id, Number(d.status), d.reason),
                            )
                          }}
                        >
                          <Field label="Status">
                            <select name="status">
                              {statuses.slice(2, 5).map((s, i) => (
                                <option key={s} value={i + 2}>
                                  {STATUS[s].label}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Reason">
                            <input name="reason" required />
                          </Field>
                          <button className="secondary" disabled={busy}>
                            Update status
                          </button>
                        </form>
                      )}
                    </>
                  )}
                  {me.role === 'Admin' && item.status !== 'Voided' && (
                    <form
                      className="section-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const d = form(e)
                        tx('Evidence voided', (c) => c.voidEvidence(item.id, d.reason))
                      }}
                    >
                      <Field label="Reason for voiding">
                        <input name="reason" required />
                      </Field>
                      <button className="danger" disabled={busy}>
                        Void evidence
                      </button>
                    </form>
                  )}
                </section>
              </div>
              <section className="panel">
                <h2>Custody history</h2>
                {history.map((h, i) => (
                  <div className="timeline" key={i}>
                    <b>{h.action}</b>
                    <span className="muted">  {fmtDate(h.at)}  —  {name(h.actor)}</span>
                    <p>{h.note || `${name(h.from)} → ${name(h.to)}`}</p>
                  </div>
                ))}
              </section>
            </>
          )}
          {screen === 'Evidence details' &&
            item &&
            me.role === 'Investigator' &&
            item.creator.toLowerCase() === me.wallet.toLowerCase() &&
            !['Released', 'Disposed', 'Voided'].includes(item.status) &&
            !files.some((f) => Number(f.evidence_id) === item.id) && (
              <section className="panel">
                <h2>Upload the original file</h2>
                <p>
                  If the previous upload failed, select the original file again. Its hash must match
                  the registered evidence.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const file = form(e).file
                    setBusy(true)
                    setError('')
                    try {
                      if ((await sha(file)) !== item.fileHash) {
                        setError(
                          'The file hash does not match this evidence. Select the original file.',
                        )
                        return
                      }
                      const body = new FormData()
                      body.append('file', file)
                      await api('/evidence/' + item.id + '/file', 'POST', body)
                      await refresh()
                      setNotice('Evidence file saved.')
                    } catch (error) {
                      setError(errorMessage(error))
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <Field label="Original evidence file">
                    <input type="file" name="file" required />
                  </Field>
                  <button disabled={busy}>Retry upload</button>
                </form>
              </section>
            )}
          {screen === 'Evidence details' &&
            item &&
            history.some((h) => h.reportHash !== ethers.ZeroHash) && (
              <section className="panel">
                <h2>Analysis report hashes</h2>
                {history
                  .filter((h) => h.reportHash !== ethers.ZeroHash)
                  .map((h, i) => (
                    <Info key={i} label={fmtDate(h.at)} value={h.reportHash} />
                  ))}
              </section>
            )}
          {screen === 'Evidence details' &&
            item &&
            me.role === 'Admin' &&
            !['Voided', 'Released', 'Disposed'].includes(item.status) && (
              <section className="panel">
                <h2>Recover custody</h2>
                <p className="muted">
                  Available only when the current holder no longer has a custody role. The reason is
                  recorded permanently.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const d = form(e)
                    tx('Custody recovered', (c) => c.recoverCustody(item.id, d.to, d.reason))
                  }}
                >
                  <Field label="New holder">
                    <select name="to" required>
                      {users
                        .filter((u) => ['Investigator', 'Analyst'].includes(u.role))
                        .map((u) => (
                          <option key={u.wallet} value={u.wallet}>
                            {name(u.wallet)} ({u.role})
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Reason">
                    <input name="reason" required />
                  </Field>
                  <button className="secondary" disabled={busy}>
                    Recover custody
                  </button>
                </form>
              </section>
            )}
          {screen === 'Cases' && (
            <div className="cases-screen">
              <div className="drawer live-drawer cases-drawer">
                {cases.map((c) => (
                  <LiveFolder
                    key={c.no}
                    kase={c}
                    items={evidence.filter((e) => e.caseId === c.no)}
                    onOpen={(v) => (typeof v === 'number' ? openEvidence(v) : openCase(v))}
                  />
                ))}
                {!cases.length && <p className="empty-desk">No cases yet.</p>}
              </div>
              <div
                className={me.role === 'Admin' ? 'cases-bottom' : 'cases-bottom cases-bottom-full'}
              >
                <div className="panel table cases-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Case ID</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map((c) => (
                        <tr key={c.no}>
                          <td>{c.no}</td>
                          <td>{c.title}</td>
                          <td>{c.status}</td>
                          <td>
                            <button className="quiet" onClick={() => openCase(c.no)}>
                              View
                            </button>
                            {me.role === 'Admin' && (
                              <>
                                <button
                                  className="quiet"
                                  onClick={() => {
                                    const f = document.getElementById('case-form')
                                    ;['no', 'title', 'description', 'status'].forEach(
                                      (k) => (f.elements[k].value = c[k]),
                                    )
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="quiet"
                                  disabled={busy}
                                  onClick={() => deleteCase(c.no)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {me.role === 'Admin' && (
                  <form id="case-form" className="panel form" onSubmit={saveCase}>
                    <h2>Add / edit case</h2>
                    <Field label="Case ID">
                      <input
                        name="no"
                        required
                        maxLength={64}
                        title="Letters, digits, dots, slashes, hyphens, or underscores"
                      />
                    </Field>
                    <Field label="Title">
                      <input name="title" required maxLength={200} />
                    </Field>
                    <Field label="Description">
                      <textarea name="description" maxLength={4000} />
                    </Field>
                    <Field label="Status">
                      <select name="status">
                        <option>Investigation</option>
                        <option>Filing</option>
                        <option>Closed</option>
                      </select>
                    </Field>
                    <button disabled={busy}>Save case</button>
                  </form>
                )}
              </div>
            </div>
          )}
          {screen === 'Users' && me.role === 'Admin' && (
            <UserManager
              users={users}
              me={me}
              busy={busy}
              evidence={evidence}
              onAdd={async (data, done) => {
                try {
                  const current = Number(await read().roles(data.wallet))
                  if (
                    current !== roles.indexOf(data.role) &&
                    !(await tx(
                      'Role assigned',
                      (c) => c.setRole(data.wallet, roles.indexOf(data.role)),
                      true,
                    ))
                  )
                    return
                } catch (e) {
                  setError(walletError(e))
                  return
                }
                try {
                  await api('/users', 'POST', data)
                  await refresh()
                  done()
                } catch (e) {
                  setError(
                    `The role was updated, but the profile could not be saved. ${errorMessage(e)}`,
                  )
                }
              }}
              onEdit={async (data, done) => {
                try {
                  const current = Number(await read().roles(data.wallet))
                  if (
                    current !== roles.indexOf(data.role) &&
                    !(await tx(
                      'Role updated',
                      (c) => c.setRole(data.wallet, roles.indexOf(data.role)),
                      true,
                    ))
                  )
                    return
                } catch (e) {
                  setError(walletError(e))
                  return
                }
                try {
                  await api('/users', 'POST', data)
                  await refresh()
                  done()
                } catch (e) {
                  setError(
                    `The role was updated, but the profile could not be saved. ${errorMessage(e)}`,
                  )
                }
              }}
              onDelete={async (u, done) => {
                if (!(await tx('Role revoked', (c) => c.setRole(u.wallet, 0), true))) return
                try {
                  await api(`/users/${u.wallet}`, 'DELETE')
                  await refresh()
                  done()
                } catch (e) {
                  setError(errorMessage(e))
                }
              }}
            />
          )}
          {screen === 'Verification' && (
            <div className="verif-page">
              <div className="verif-left-col">
                <p className="verif-desc">
                  The file hash is computed in your browser and compared against the on-chain hash.
                </p>
                <form
                  className="panel form verif-form"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const d = form(e)
                    const matchItem = evidence.find((i) => i.id === Number(d.id))
                    const hash = await sha(d.file)
                    const match = hash.toLowerCase() === matchItem.fileHash.toLowerCase()
                    setVerifyResult({ hash, match, item: matchItem })
                    setVerifyLog((log) =>
                      [
                        {
                          at: new Date().toISOString(),
                          id: matchItem.id,
                          kind: matchItem.kind,
                          file: d.file.name,
                          match,
                        },
                        ...log,
                      ].slice(0, 20),
                    )
                  }}
                >
                  <Field label="Evidence">
                    <select name="id" required>
                      {evidence.map((e) => (
                        <option key={e.id} value={e.id}>
                          #{e.id}: {e.kind}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="File">
                    <input name="file" type="file" required />
                  </Field>
                  <button disabled={!evidence.length}>Compare hashes</button>
                </form>
                {verifyResult && (
                  <div
                    className={verifyResult.match ? 'verif-result notice' : 'verif-result error'}
                  >
                    <b>{verifyResult.match ? 'Hash matches ✓' : 'Hash does not match'}</b>
                    <Info label="File" value={verifyResult.hash} />
                    <Info label="On-chain" value={verifyResult.item.fileHash} />
                  </div>
                )}
              </div>
              <section className="panel verif-log-panel">
                <h2>
                  Verification history<span className="count">{verifyLog.length}</span>
                </h2>
                <div className="verif-log-scroll">
                  {verifyLog.length ? (
                    <ul className="verif-log">
                      {verifyLog.map((v, i) => (
                        <li key={i}>
                          <span className={v.match ? 'verif-dot ok' : 'verif-dot bad'} />
                          <div className="verif-what">
                            <b>
                              #{String(v.id).padStart(3, '0')} {v.kind}
                            </b>
                            <span className="verif-file">{v.file}</span>
                          </div>
                          <span className="verif-when">
                            {new Date(v.at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className={v.match ? 'verif-badge ok' : 'verif-badge bad'}>
                            {v.match ? 'Match' : 'Mismatch'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="verif-empty">
                      Files you verify during this session will appear here.
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}
          {screen === 'Case details' && kase && (
            <CaseDetail
              kase={kase}
              items={evidence.filter((e) => e.caseId === kase.no)}
              name={name}
              onOpenEvidence={openEvidence}
              onRegister={() => setScreen('Register')}
              onEdit={() => {
                setScreen('Cases')
                setTimeout(() => {
                  const f = document.getElementById('case-form')
                  if (!f) return
                  ;['no', 'title', 'description', 'status'].forEach((k) => {
                    if (f.elements[k]) f.elements[k].value = kase[k] || ''
                  })
                  f.elements.title?.focus()
                }, 60)
              }}
              onBack={() => setScreen('Cases')}
              canEdit={me.role === 'Admin'}
              canRegister={me.role === 'Investigator' && kase.status === 'Investigation'}
            />
          )}
          {screen === 'Case details' && !kase && (
            <section className="panel">
              <p className="muted">That case is no longer available.</p>
              <button className="secondary" onClick={() => setScreen('Cases')}>
                Back to cases
              </button>
            </section>
          )}
          {screen === 'Receipt' && regReceipt && (
            <Receipt
              receipt={regReceipt}
              onOpenEvidence={openEvidence}
              onRegisterAnother={() => {
                setRegReceipt(null)
                setScreen('Register')
              }}
              onDone={() => {
                setRegReceipt(null)
                setScreen('Dashboard')
              }}
            />
          )}
          {screen === 'Activity log' &&
            me.role === 'Admin' &&
            (() => {
              // Build flat event list from all evidence items
              const actEvents = []
              for (const e of evidence) {
                if (e.createdAt) {
                  const byUser = users.find(
                    (u) => u.wallet?.toLowerCase() === (e.creator || e.holder)?.toLowerCase(),
                  )
                  actEvents.push({
                    evidenceId: e.id,
                    action: 'Registration',
                    actor: byUser?.name || short(e.creator || e.holder),
                    detail: `${e.kind} · Case ${e.caseId}`,
                    at: Number(e.createdAt) * 1000,
                    block: e.blockNumber,
                    txHash: null,
                  })
                }
              }
              return <ActivityLog events={actEvents} onOpenEvidence={openEvidence} />
            })()}
          {screen === 'Profile' && (
            <Profile
              me={me}
              profile={
                me.user || users.find((u) => u.wallet.toLowerCase() === me.wallet.toLowerCase())
              }
              held={evidence.filter(
                (e) =>
                  e.holder.toLowerCase() === me.wallet.toLowerCase() &&
                  !['Voided', 'Released', 'Disposed'].includes(e.status),
              )}
              registered={evidence.filter(
                (e) => e.creator?.toLowerCase() === me.wallet.toLowerCase(),
              )}
              chainId={CHAIN_ID}
              contract={ROLE_ADDRESS}
              onOpenEvidence={openEvidence}
              onSignOut={logout}
            />
          )}
        </div>
      </main>
    </div>
  )
}
function List({ items, open, name }) {
  const columns = [
    {
      key: 'id',
      label: 'Label',
      width: '105px',
      render: (e) => (
        <>
          <RowTag status={e.status} />
          <span className="mono">#{String(e.id).padStart(3, '0')}</span>
        </>
      ),
    },
    { key: 'kind', label: 'Evidence', width: '1.5fr', render: (e) => <b>{e.kind}</b> },
    {
      key: 'case',
      label: 'Case',
      width: '1fr',
      render: (e) => <span className="mono">{e.caseId}</span>,
    },
    { key: 'holder', label: 'Holder', width: '1fr', render: (e) => name(e.holder) },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: (e) => <StatusStamp status={e.status} />,
    },
  ]
  return (
    <Ledger columns={columns} rows={items} rowKey={(e) => e.id} onRowClick={(e) => open(e.id)} />
  )
}
