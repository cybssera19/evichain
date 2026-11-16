import { useLayoutEffect, useRef, useState } from 'react'

// ukuran termasuk padding, dipakai untuk menggambar bentuk SVG di belakang konten
export function useSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ width: el.offsetWidth, height: el.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, size]
}
