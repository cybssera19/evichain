import { CaseSticker } from './Status'
import { ChevronRight, Plus } from './Icons'
import { STATUS, evidenceCode, initials, formatDate } from '../lib/format'
import './casedetail.css'

const fromUnix = (sec) => formatDate(new Date(Number(sec) * 1000).toISOString())
const bandColor = (status) => STATUS[status]?.color ?? 'var(--void)'
const STAMP_COLORS = {
  Collected: '#2d5be3',
  InAnalysis: '#c98a0a',
  Stored: '#1f9d63',
  Released: '#0f4a3c',
  Disposed: '#9aa0a6',
  Voided: '#9aa0a6',
}
const stampColor = (status) => STAMP_COLORS[status] ?? '#9aa0a6'
const STAMP_LABELS = {
  Collected: 'Collected',
  InAnalysis: 'In analysis',
  Stored: 'Stored',
  Released: 'Released',
  Disposed: 'Disposed',
  Voided: 'Void',
}

function CaseTag({ item, name, onOpen }) {
  const who = name(item.holder)
  return (
    <button type="button" className="case-tag" onClick={() => onOpen(item.id)}>
      <span className="case-tag-band" style={{ background: bandColor(item.status) }}>
        <span className="case-tag-hole" />
      </span>
      <span className="case-tag-body">
        <span className="case-tag-id mono">{evidenceCode(item.id)}</span>
        <span className="case-tag-name">{item.kind}</span>
        <span className="case-tag-holder">
          <span className="case-tag-avatar">{initials(who)}</span>
          {who}
        </span>
        <span className="case-tag-date">Registered {fromUnix(item.createdAt)}</span>
        <span className="case-tag-rule" />
        <span className="case-tag-foot">
          <span
            className="case-tag-stamp"
            style={{
              color: stampColor(item.status),
              border: `1.6px solid ${stampColor(item.status)}`,
            }}
          >
            {STAMP_LABELS[item.status] ?? item.status}
          </span>
          <span className="case-tag-go">
            <ChevronRight />
          </span>
        </span>
      </span>
    </button>
  )
}

export default function CaseDetail({
  kase,
  items,
  name,
  onOpenEvidence,
  onRegister,
  onEdit,
  onBack,
  canEdit,
  canRegister,
}) {
  const inAnalysis = items.filter((e) => e.status === 'InAnalysis').length
  const events = [
    ...items.map((e) => ({
      key: 'e' + e.id,
      at: Number(e.createdAt) * 1000,
      text: `${evidenceCode(e.id)} ${e.kind} registered`,
      color: bandColor(e.status),
    })),
    ...(kase.created_at
      ? [
          {
            key: 'c',
            at: new Date(kase.created_at).getTime(),
            text: `Case created by ${name(kase.created_by)}`,
            color: 'var(--ink-soft)',
          },
        ]
      : []),
  ].sort((a, b) => b.at - a.at)
  const updated = events.length ? new Date(events[0].at).toISOString() : kase.created_at

  return (
    <div className="case-detail">
      <div className="crumbs">
        <button type="button" className="btn-text" onClick={onBack}>
          Cases
        </button>
        <ChevronRight />
        <span className="mono">{kase.no}</span>
      </div>
      <div className="case-detail-head">
        <div className="title-row">
          <h1>{kase.title}</h1>
          <CaseSticker status={kase.status} />
        </div>
        <div className="case-detail-actions">
          {canEdit && (
            <button type="button" className="secondary" onClick={onEdit}>
              Edit case
            </button>
          )}
          {canRegister && (
            <button type="button" onClick={onRegister}>
              Register evidence
            </button>
          )}
        </div>
      </div>

      <div className="case-spread">
        <div className="spread-tab mono">{kase.no}</div>
        <div className="spread-left">
          <section className="sheet">
            <h3>Case description</h3>
            <p className="sheet-text">
              {kase.description || 'No description recorded for this case.'}
            </p>
            <span className="sheet-rule" />
            <div className="sheet-stats">
              <div>
                <span className="muted">Evidence items</span>
                <b>{items.length}</b>
              </div>
              <div>
                <span className="muted">In analysis</span>
                <b>{inAnalysis}</b>
              </div>
              <div>
                <span className="muted">Created</span>
                <b>
                  {kase.created_at
                    ? `${formatDate(kase.created_at)} by ${name(kase.created_by)}`
                    : '—'}
                </b>
              </div>
              <div>
                <span className="muted">Last updated</span>
                <b>{updated ? formatDate(updated) : '—'}</b>
              </div>
            </div>
          </section>
          <section className="sheet sheet-history">
            <h3>Case history</h3>
            {events.length ? (
              events.map((ev) => (
                <div className="sheet-event" key={ev.key}>
                  <span className="mono sheet-event-date">
                    {formatDate(new Date(ev.at).toISOString()).replace(/ \d{4}$/, '')}
                  </span>
                  <span className="dot" style={{ background: ev.color }} />
                  <span className="sheet-event-text">{ev.text}</span>
                </div>
              ))
            ) : (
              <p className="muted">No activity recorded yet.</p>
            )}
          </section>
        </div>

        <div className="spread-right">
          <div className="spread-title">
            <h3>Evidence</h3>
            <span className="muted">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="case-tags">
            {items.map((item) => (
              <CaseTag key={item.id} item={item} name={name} onOpen={onOpenEvidence} />
            ))}
            {canRegister && (
              <button type="button" className="new-slot" onClick={onRegister}>
                <span className="new-slot-icon">
                  <Plus size={20} />
                </span>
                Register new evidence
              </button>
            )}
            {!items.length && !canRegister && (
              <p className="empty-desk">No evidence in this case yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
