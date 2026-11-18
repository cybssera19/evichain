import { randomBytes, createHash } from 'node:crypto'
import { ethers } from 'ethers'
import { SiweMessage } from 'siwe'
import { fail } from './errors.js'

export function installAuth(
  app,
  { pool, currentRole, currentVersion = async () => '0', wrap, now = Date.now },
) {
  const origin = new URL(process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173')
  const secure = process.env.NODE_ENV === 'production'
  if (secure && origin.protocol !== 'https:')
    throw new Error('Production FRONTEND_ORIGIN must use HTTPS')
  const cookie = { httpOnly: true, secure, sameSite: 'strict', path: '/' }
  const sessions = new Map(),
    challenges = new Map(),
    attempts = new Map()
  const digest = (value) => createHash('sha256').update(value).digest('hex')
  const sessionKey = (req) =>
    typeof req.cookies.evichain_session === 'string' ? digest(req.cookies.evichain_session) : ''
  const prune = () => {
    for (const map of [sessions, challenges, attempts])
      for (const [key, value] of map) if (value.expires <= now()) map.delete(key)
  }
  const timer = setInterval(prune, 60_000)
  timer.unref()
  app.disable('x-powered-by')
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    res.set('X-Content-Type-Options', 'nosniff')
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('origin') !== origin.origin)
      return fail(res, 403, 'ORIGIN_DENIED')
    next()
  })
  app.use('/api/auth', (req, res, next) => {
    if (req.path === '/logout') return next()
    prune()
    const key = req.ip
    const entry = attempts.get(key) || { count: 0, expires: now() + 5 * 60_000 }
    attempts.set(key, entry)
    if (++entry.count > 30 || challenges.size >= 10000 || sessions.size >= 10000) {
      res.set('Retry-After', '300')
      return fail(res, 429, 'RATE_LIMITED')
    }
    next()
  })
  const auth = wrap(async (req, res, next) => {
    const session = sessions.get(sessionKey(req))
    if (!session || session.expires <= now()) {
      sessions.delete(sessionKey(req))
      res.clearCookie('evichain_session', cookie)
      return fail(res, 401, 'AUTH_REQUIRED')
    }
    if (session.version !== String(await currentVersion(session.wallet))) {
      sessions.delete(sessionKey(req))
      res.clearCookie('evichain_session', cookie)
      return fail(res, 401, 'AUTH_REQUIRED')
    }
    req.wallet = session.wallet
    req.role = await currentRole(session.wallet)
    next()
  })
  app.post(
    '/api/auth/nonce',
    wrap(async (req, res) => {
      let wallet
      try {
        wallet = ethers.getAddress(req.body?.wallet)
      } catch {
        return fail(res, 400, 'INVALID_WALLET')
      }
      const nonce = randomBytes(16).toString('hex'),
        token = randomBytes(32).toString('hex')
      const expires = now() + 5 * 60_000
      const message = new SiweMessage({
        domain: origin.host,
        address: wallet,
        statement: 'Sign in to EviChain.',
        uri: origin.origin,
        version: '1',
        chainId: Number(process.env.CHAIN_ID || 31337),
        nonce,
        issuedAt: new Date(now()).toISOString(),
        expirationTime: new Date(expires).toISOString(),
      }).prepareMessage()
      if (req.cookies.evichain_challenge) challenges.delete(digest(req.cookies.evichain_challenge))
      challenges.set(digest(token), { wallet, nonce, message, expires })
      res.cookie('evichain_challenge', token, { ...cookie, maxAge: 5 * 60_000 })
      res.json({ nonce, domain: origin.host, message })
    }),
  )
  app.post(
    '/api/auth/verify',
    wrap(async (req, res) => {
      const key =
        typeof req.cookies.evichain_challenge === 'string'
          ? digest(req.cookies.evichain_challenge)
          : ''
      const challenge = challenges.get(key)

      challenges.delete(key)
      res.clearCookie('evichain_challenge', cookie)
      if (!challenge || challenge.expires <= now()) return fail(res, 401, 'AUTH_CHALLENGE')
      if (
        req.body?.message !== challenge.message ||
        typeof req.body?.signature !== 'string' ||
        req.body.signature.length > 2048
      )
        return fail(res, 401, 'AUTH_INVALID')
      try {
        const result = await new SiweMessage(challenge.message).verify({
          signature: req.body.signature,
          domain: origin.host,
          nonce: challenge.nonce,
          time: new Date(now()).toISOString(),
        })
        if (!result.success) return fail(res, 401, 'AUTH_INVALID')
      } catch {
        return fail(res, 401, 'AUTH_INVALID')
      }
      const role = await currentRole(challenge.wallet)
      const user = (await pool.query('SELECT * FROM users WHERE wallet=$1', [challenge.wallet]))
        .rows[0]
      sessions.delete(sessionKey(req))
      const token = randomBytes(32).toString('hex')
      sessions.set(digest(token), {
        wallet: challenge.wallet,
        version: String(await currentVersion(challenge.wallet)),
        expires: now() + 8 * 3600_000,
      })
      res.cookie('evichain_session', token, { ...cookie, maxAge: 8 * 3600_000 })
      res.json({ wallet: challenge.wallet, role, user })
    }),
  )
  app.post('/api/auth/logout', (req, res) => {
    sessions.delete(sessionKey(req))
    if (req.cookies.evichain_challenge) challenges.delete(digest(req.cookies.evichain_challenge))
    res.clearCookie('evichain_session', cookie)
    res.clearCookie('evichain_challenge', cookie)
    res.json({ ok: true })
  })
  return auth
}
