import { formatSize, evidenceCode } from '../lib/format'
import { Logo } from './Icons'
import './envelope.css'

export default function Envelope({ event, sender, me, onOpen }) {
  const d = new Date(event.at)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  return (
    <div className="envelope">
      <div className="env-from">
        <b>{sender?.unit}</b>
        <span>{sender?.name}</span>
      </div>

      <svg className="env-postmark" width="150" height="64" viewBox="0 0 150 64" fill="none" stroke="#5E4E30">
        <circle cx="118" cy="32" r="27" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="118" cy="32" r="21" strokeOpacity="0.35" />
        {[18, 28, 38, 48].map((y) => (
          <path
            key={y}
            d={`M2 ${y}C12 ${y - 4} 22 ${y + 4} 32 ${y}C42 ${y - 4} 52 ${y + 4} 62 ${y}C72 ${y - 4} 82 ${y + 4} 90 ${y}`}
            strokeOpacity="0.4"
            strokeWidth="1.4"
          />
        ))}
      </svg>
      <span className="env-postmark-date mono">
        {d.getDate()} {months[d.getMonth()]}
        <br />
        {d.getFullYear()}
      </span>

      <div className="env-stamp">
        <Logo light />
      </div>

      <div className="env-to">
        <span className="muted">Untuk</span>
        <b>{me.name}</b>
        <span>Hasil analisis bukti {evidenceCode(event.evidenceId)}</span>
      </div>

      <span className="env-file mono">
        {event.report.file}
        {event.report.size ? `   ${formatSize(event.report.size)}` : ''}
      </span>

      <span className="env-red">Perlu ditinjau</span>

      <button className="btn btn-green env-open" onClick={onOpen}>
        Buka hasil
      </button>
    </div>
  )
}
