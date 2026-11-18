import { Check } from './Icons'
import { Barcode } from './Tags'
import { evidenceCode, formatBlock, formatDateTime } from '../lib/format'
import './receipt.css'

export default function Receipt({ receipt, onOpenEvidence, onRegisterAnother, onDone }) {
  return (
    <div className="receipt-screen">
      <div className="receipt">
        <div className="receipt-notch receipt-notch-top" />
        <div className="receipt-body">
          <span className="receipt-check"><Check size={18} /></span>
          <h2>Evidence registered</h2>
          <p className="muted receipt-sub">Recorded permanently on the blockchain. This record cannot be edited or deleted.</p>

          <div className="receipt-id mono">{evidenceCode(receipt.id)}</div>
          <div className="receipt-kind">{receipt.kind}</div>

          <span className="receipt-rule" />
          <dl className="receipt-rows">
            <div><dt>Case</dt><dd className="mono">{receipt.caseId}</dd></div>
            <div><dt>Block</dt><dd className="mono">{formatBlock(receipt.block)}</dd></div>
            <div><dt>Transaction</dt><dd className="mono receipt-wrap">{receipt.tx}</dd></div>
            <div><dt>SHA-256</dt><dd className="mono receipt-wrap">{receipt.hash}</dd></div>
            <div><dt>File</dt><dd>{receipt.file || 'Not uploaded'}</dd></div>
            <div><dt>Registered</dt><dd>{formatDateTime(receipt.at)}</dd></div>
          </dl>
          <span className="receipt-rule" />

          <div className="receipt-barcode"><Barcode seed={receipt.id} width={200} height={34} /></div>
          <p className="receipt-foot mono">EVICHAIN · CHAIN OF CUSTODY · {evidenceCode(receipt.id)}</p>
        </div>
        <div className="receipt-notch receipt-notch-bottom" />
      </div>

      <div className="receipt-actions">
        <button onClick={() => onOpenEvidence(receipt.id)}>Open evidence detail</button>
        <button className="secondary" onClick={onRegisterAnother}>Register another</button>
        <button className="quiet" onClick={onDone}>Back to dashboard</button>
      </div>
    </div>
  )
}
