export async function sha256File(file) {
  const buf = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const isSha256 = (s) => /^[0-9a-f]{64}$/i.test(s.trim())
