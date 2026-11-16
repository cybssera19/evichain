import { Link, useNavigate } from 'react-router-dom'
import { useLookup, useStore } from '../store/AppStore'
import { STATUS, evidenceCode, formatBlock, formatShort, formatToday, shortTx } from '../lib/format'
import { EVENT_LABEL, eventWho } from '../lib/events'
import Folder from '../components/Folder'
import Envelope from '../components/Envelope'
import { TapeH } from '../components/Tape'
import '../components/folder.css'
import './dashboard.css'

export function ChainSegment({ event, first }) {
  const { user } = useLookup()
  const { state } = useStore()
  const prev = [...state.events].filter((e) => e.block < event.block).sort((a, b) => b.block - a.block)[0]
  return (
    <>
      <div>
        <div className="entry-head">
          <span className="seg-block mono">blok {formatBlock(event.block)}</span>
          <span className="entry-time">{formatShort(event.at)}</span>
        </div>
        <div className="entry-title" style={{ marginTop: 6 }}>
          {first && <span className="pin" />}
          <b>{EVENT_LABEL[event.type]}</b>
          <span className="mono">{evidenceCode(event.evidenceId)}</span>
        </div>
        <p className="entry-note">{eventWho(event, user, true)}</p>
      </div>
      <div className="seg-hashes mono">
        <span>
          hash <b>{shortTx(event.tx)}</b>
        </span>
        {prev && <span className="faint">prev {shortTx(prev.tx)}</span>}
      </div>
    </>
  )
}

export default function Dashboard() {
  const { state, me, actions } = useStore()
  const { kase, evidenceIn, recent, item, user } = useLookup()
  const navigate = useNavigate()

  const lastTouch = (no) =>
    state.events
      .filter((e) => item(e.evidenceId)?.caseNo === no)
      .reduce((m, e) => (e.at > m ? e.at : m), kase(no).createdAt)

  const involved = (c) => c.createdBy === me.id || evidenceIn(c.no).some((i) => i.holder === me.id)
  const myCases = state.cases
    .filter((c) => c.status !== 'Selesai' && evidenceIn(c.no).length)
    .sort((a, b) => involved(b) - involved(a) || lastTouch(b.no).localeCompare(lastTouch(a.no)))
    .slice(0, 3)

  const letter = state.events.find((e) => {
    if (e.type !== 'analysis' || e.reviewed) return false
    const ev = item(e.evidenceId)
    return ev && (ev.registeredBy === me.id || kase(ev.caseNo)?.createdBy === me.id)
  })

  const openLetter = () => {
    actions.markReviewed(letter.id)
    navigate(`/bukti/${letter.evidenceId}`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="date">{formatToday()}</p>
          <h1>Halo, {me.name.split(' ')[0]}</h1>
        </div>
        <div className="actions">
          <Link to="/verifikasi" className="btn btn-outline">
            Verifikasi file
          </Link>
          {me.role === 'Penyidik' && (
            <Link to="/registrasi" className="btn btn-red">
              Registrasi bukti
            </Link>
          )}
        </div>
      </div>

      <div className="section-title">
        <h2>Kasus aktif</h2>
        <div className="legend">
          {['Collected', 'Stored', 'InAnalysis', 'Voided'].map((s) => (
            <span key={s}>
              <i style={{ background: STATUS[s].color }} />
              {STATUS[s].label}
            </span>
          ))}
        </div>
      </div>

      {myCases.length ? (
        <div className="drawer dash-drawer">
          {myCases.map((c) => (
            <Folder key={c.no} kase={c} items={evidenceIn(c.no)} meId={me.id} />
          ))}
        </div>
      ) : (
        <div className="drawer">
          <p className="empty-desk">Belum ada kasus yang melibatkan Anda.</p>
        </div>
      )}

      <div className={`dash-bottom ${letter ? '' : 'solo'}`}>
        {letter && (
          <div className="dash-letter">
            <Envelope event={letter} sender={user(letter.by)} me={me} onOpen={openLetter} />
          </div>
        )}
        <div>
          <div className="section-title">
            <h2>Rantai terbaru</h2>
            <Link to="/bukti" className="side">
              Lihat semua
            </Link>
          </div>
          <TapeH segments={recent(4).map((e, i) => <ChainSegment key={e.id} event={e} first={i === 0} />)} />
        </div>
      </div>
    </>
  )
}
