import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState } from 'react'
import * as seed from '../data/seed'
import { nextBlock, randomTx } from '../lib/chain'

const StoreContext = createContext(null)

const initialState = {
  userId: null,
  loginAt: null,
  users: seed.users,
  cases: seed.cases,
  evidence: seed.evidence,
  events: seed.events,
  verifications: seed.verifications,
}

function reducer(state, action) {
  switch (action.type) {
    case 'login':
      return { ...state, userId: action.userId, loginAt: new Date().toISOString() }
    case 'logout':
      return { ...state, userId: null, loginAt: null }
    case 'event':
      return {
        ...state,
        events: [...state.events, action.event],
        evidence: action.evidence ?? state.evidence,
      }
    case 'review':
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.id ? { ...e, reviewed: true } : e)),
      }
    case 'cases':
      return { ...state, cases: action.cases }
    case 'users':
      return { ...state, users: action.users }
    case 'verify':
      return { ...state, verifications: [...state.verifications, action.item] }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const ref = useRef(state)
  ref.current = state

  const [pendingTx, setPendingTx] = useState(null)
  const [receipts, setReceipts] = useState([])

  const makeEvent = (data) => {
    const s = ref.current
    const last = s.events.reduce((m, e) => Math.max(m, e.block), 0)
    return {
      id: s.events.length + 1,
      at: new Date().toISOString(),
      by: s.userId,
      block: nextBlock(last),
      tx: randomTx(),
      ...data,
    }
  }

  const patchEvidence = (id, patch) =>
    ref.current.evidence.map((e) => (e.id === id ? { ...e, ...patch } : e))

  const actions = useMemo(
    () => ({
      login: (userId) => dispatch({ type: 'login', userId }),
      logout: () => dispatch({ type: 'logout' }),

      register({ name, caseNo, note, file, hash }) {
        const s = ref.current
        const id = Math.max(...s.evidence.map((e) => e.id)) + 1
        const event = makeEvent({ type: 'register', evidenceId: id, note: note || name })
        const item = {
          id,
          name,
          caseNo,
          note,
          file,
          hash,
          holder: s.userId,
          status: 'Collected',
          registeredBy: s.userId,
          registeredAt: event.at,
        }
        dispatch({ type: 'event', event, evidence: [...s.evidence, item] })
        return { item, event }
      },

      transfer(id, to, note) {
        const s = ref.current
        const item = s.evidence.find((e) => e.id === id)
        const recipient = s.users.find((u) => u.id === to)
        let status = item.status
        if (recipient.role === 'Analis') status = 'InAnalysis'
        else if (item.status === 'InAnalysis') status = 'Stored'
        const event = makeEvent({ type: 'transfer', evidenceId: id, from: item.holder, to, note })
        dispatch({ type: 'event', event, evidence: patchEvidence(id, { holder: to, status }) })
        return event
      },

      changeStatus(id, status, reason) {
        const event = makeEvent({ type: status === 'Voided' ? 'void' : 'status', evidenceId: id, status, note: reason })
        dispatch({ type: 'event', event, evidence: patchEvidence(id, { status }) })
        return event
      },

      editMetadata(id, { name, note }) {
        const event = makeEvent({ type: 'metadata', evidenceId: id, note: 'Metadata diperbarui' })
        dispatch({ type: 'event', event, evidence: patchEvidence(id, { name, note }) })
        return event
      },

      markReviewed: (id) => dispatch({ type: 'review', id }),

      saveCase(data) {
        const s = ref.current
        const exists = s.cases.some((c) => c.no === data.no)
        const cases = exists
          ? s.cases.map((c) => (c.no === data.no ? { ...c, ...data } : c))
          : [{ ...data, createdBy: s.userId, createdAt: new Date().toISOString() }, ...s.cases]
        dispatch({ type: 'cases', cases })
      },

      saveUser(data) {
        const s = ref.current
        const exists = s.users.some((u) => u.id === data.id)
        const users = exists ? s.users.map((u) => (u.id === data.id ? { ...u, ...data } : u)) : [...s.users, data]
        dispatch({ type: 'users', users })
      },

      removeUser: (id) => dispatch({ type: 'users', users: ref.current.users.filter((u) => u.id !== id) }),

      addVerification(evidenceId, match) {
        const s = ref.current
        const item = { id: s.verifications.length + 1, evidenceId, match, by: s.userId, at: new Date().toISOString() }
        dispatch({ type: 'verify', item })
        return item
      },
    }),
    [],
  )

  // popup MetaMask tiruan, resolve true kalau dikonfirmasi
  const requestTx = useCallback(
    (tx) =>
      new Promise((resolve) => {
        setPendingTx({ ...tx, resolve })
      }),
    [],
  )

  const closeTx = (ok) => {
    pendingTx?.resolve(ok)
    setPendingTx(null)
  }

  const notify = useCallback((receipt) => {
    const id = Date.now()
    setReceipts((r) => [...r, { ...receipt, id }])
    setTimeout(() => setReceipts((r) => r.filter((x) => x.id !== id)), 7000)
  }, [])

  const dismiss = (id) => setReceipts((r) => r.filter((x) => x.id !== id))

  const value = {
    state,
    actions,
    me: state.users.find((u) => u.id === state.userId) ?? null,
    pendingTx,
    requestTx,
    closeTx,
    receipts,
    notify,
    dismiss,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}

export function useLookup() {
  const { state } = useStore()
  return useMemo(() => {
    const user = (id) => state.users.find((u) => u.id === id)
    const kase = (no) => state.cases.find((c) => c.no === no)
    const item = (id) => state.evidence.find((e) => e.id === Number(id))
    const eventsOf = (id) => state.events.filter((e) => e.evidenceId === Number(id))
    const evidenceIn = (no) => state.evidence.filter((e) => e.caseNo === no)
    const recent = (n) => [...state.events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, n)
    return { user, kase, item, eventsOf, evidenceIn, recent }
  }, [state])
}
