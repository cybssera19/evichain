import { useState } from 'react'
import { Check, Copy } from './Icons'

export default function HashBox({ value }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard bisa ditolak di http biasa, abaikan saja
    }
  }

  return (
    <div className="hash-box">
      <span style={{ flex: 1 }}>{value}</span>
      <button onClick={copy} title={copied ? 'Tersalin' : 'Salin'} aria-label="Salin hash">
        {copied ? <Check size={14} /> : <Copy />}
      </button>
    </div>
  )
}
