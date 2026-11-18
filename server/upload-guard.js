import { fail } from './errors.js'
export function uploadGuard({ limit = 4, perWallet = 3 } = {}) {
  let total = 0
  const wallets = new Map()
  return (req, res, next) => {
    const count = wallets.get(req.wallet) || 0
    if (total >= limit || count >= perWallet) {
      res.set('Retry-After', '5')
      return fail(res, 429, 'UPLOAD_BUSY')
    }
    total++
    wallets.set(req.wallet, count + 1)
    let done = false
    const release = () => {
      if (done) return
      done = true
      total--
      const remaining = wallets.get(req.wallet) - 1
      if (remaining) wallets.set(req.wallet, remaining)
      else wallets.delete(req.wallet)
    }
    res.once('finish', release)
    res.once('close', release)
    next()
  }
}
