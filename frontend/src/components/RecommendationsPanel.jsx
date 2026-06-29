import { useEffect, useState } from 'react'
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, User, Shield, Clock, Target,
} from 'lucide-react'
import clsx from 'clsx'
import api from '../lib/api'

const URGENCY_STYLE = {
  immediate:      'text-red-400    bg-red-400/10    border-red-400/30',
  'this-week':    'text-orange-400 bg-orange-400/10 border-orange-400/30',
  'this-month':   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'this-quarter': 'text-blue-400   bg-blue-400/10   border-blue-400/30',
}

const PRIORITY_STYLE = {
  P1: 'text-red-400    bg-red-400/10',
  P2: 'text-yellow-400 bg-yellow-400/10',
  P3: 'text-slate-400  bg-slate-400/10',
}

const CATEGORY_ICON = {
  'risk-mitigation': Shield,
  expansion:         TrendingUp,
  relationship:      User,
  technical:         AlertTriangle,
  strategic:         TrendingUp,
}

// ── Reject modal ──────────────────────────────────────────────
function RejectModal({ rec, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-2 border border-border rounded-xl p-5 w-full max-w-md">
        <h3 className="text-sm font-semibold text-white mb-1">Reject recommendation</h3>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{rec.title}</p>
        {/* <label className="text-[10px] text-slate-500 block mb-1">Reason for rejection <span className="text-red-400">*</span></label>
        <textarea
          className="input w-full text-xs h-20 resize-none mb-3"
          placeholder="Why is this recommendation not appropriate right now?"
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        /> */}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-xs border border-border px-3">Cancel</button>
          <button
            onClick={() => onConfirm()}
            // disabled={!reason.trim()}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition-colors"
          >
            <XCircle size={12} /> Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function RecCard({ rec, onApprove, onReject, reportStatus }) {
  const [open,        setOpen]        = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  const Icon    = CATEGORY_ICON[rec.category] || TrendingUp
  const status  = (rec.status || '').toLowerCase()
  const urgency = URGENCY_STYLE[rec.urgency] || 'text-slate-400 bg-surface-3 border-border'
  const priority= PRIORITY_STYLE[rec.priority] || PRIORITY_STYLE.P3
  const canAct = !['approved','rejected','accepted','declined','completed'].includes(status) || status === 'awaiting_approval'
  const canReview = ['awaiting_approval', 'partially_approved'].includes((reportStatus || '').toLowerCase())

  const handleRejectConfirm = () => {
    setRejectModal(false)
    onReject(rec.id,'Reason not provided')
  }

  return (
    <>
      {rejectModal && (
        <RejectModal
          rec={rec}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectModal(false)}
        />
      )}

      <div className={clsx(
        'border rounded-xl overflow-hidden transition-all',
        status === 'approved' ? 'border-emerald-500/40 bg-emerald-500/5' :
        status === 'rejected' ? 'border-red-500/20 bg-red-500/5 opacity-60' :
        'border-border bg-surface-2'
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
              status === 'approved' ? 'bg-emerald-500/20' : 'bg-surface-3'
            )}>
              <Icon size={13} className={status === 'approved' ? 'text-emerald-400' : 'text-slate-400'} />
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={clsx('badge border text-[10px]', urgency)}>
                  <Clock size={9} /> {rec.urgency}
                </span>
                <span className={clsx('badge text-[10px]', priority)}>
                  {rec.priority || 'P2'}
                </span>
                {rec.due_date && (
                  <span className="text-[10px] text-slate-500">due {rec.due_date}</span>
                )}
                <span className="text-[10px] text-slate-600">#{rec.rank} · {rec.category}</span>
                {status === 'approved' && <span className="badge text-emerald-400 bg-emerald-400/10"><CheckCircle size={9}/> Approved</span>}
                {status === 'rejected' && <span className="badge text-red-400 bg-red-400/10"><XCircle size={9}/> Rejected</span>}
              </div>

              {/* Title */}
              <div className="text-sm font-semibold text-white leading-snug mb-1">{rec.title}</div>

              {/* Description */}
              <div className="text-xs text-slate-400 leading-relaxed mb-2">{rec.description}</div>

              {/* Expected outcome — primary metric, replaces confidence */}
              {rec.expected_outcome && (
                <div className="flex items-start gap-1.5 bg-surface-3 rounded-lg px-2.5 py-1.5">
                  <Target size={10} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Expected Outcome</div>
                    <div className="text-[10px] text-slate-200">{rec.expected_outcome}</div>
                  </div>
                </div>
              )}

              {status === 'rejected' && rec.rejection_reason && (
                <div className="mt-2 text-[10px] text-red-400/80 italic">
                  Rejected: {rec.rejection_reason}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center gap-1.5 ml-1">
              <button onClick={() => setOpen(!open)} className="btn-ghost p-1.5">
                {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {canAct && canReview && (
                <>
                  <button
                    onClick={() => setRejectModal(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Reject"
                  >
                    <XCircle size={13} />
                  </button>
                  <button
                    onClick={() => onApprove(rec.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                    title="Approve → adds to Todos"
                  >
                    <CheckCircle size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {open && (
          <div className="border-t border-border px-4 py-3 space-y-3">
            {rec.business_impact && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Impact</div>
                <div className="text-xs text-emerald-400 font-medium">{rec.business_impact}</div>
              </div>
            )}
            {rec.evidence?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Evidence</div>
                <div className="space-y-1">
                  {rec.evidence.map((e, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="text-brand-500 flex-shrink-0 font-medium">[{e.source}]</span>
                      <span className="text-slate-400">{e.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rec.execution_steps?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Execution Steps</div>
                <div className="space-y-1">
                  {rec.execution_steps.map((s, i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-brand-500 font-mono flex-shrink-0">{i+1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rec.risks_if_not_done && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk If Not Done</div>
                <div className="text-xs text-red-400">{rec.risks_if_not_done}</div>
              </div>
            )}
            {rec.success_metric && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Success Metric</div>
                <div className="text-xs text-slate-300">{rec.success_metric}</div>
              </div>
            )}
            {(rec.owner || rec.due_date) && (
              <div className="flex items-center gap-3 pt-1 border-t border-border text-xs text-slate-500">
                {rec.owner && <span className="flex items-center gap-1"><User size={10}/> {rec.owner}</span>}
                {rec.due_date && <span className="flex items-center gap-1"><Clock size={10}/> Due {rec.due_date}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function RecommendationsPanel({ report, reportId, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [handledIds, setHandledIds] = useState(new Set())
  if (!report) return null

  const recs = report.recommendations || []
  const stats = report.recommendation_stats || {}
  const hiddenStatuses = ['approved', 'accepted', 'rejected', 'declined', 'completed']

  useEffect(() => {
    setHandledIds(new Set())
  }, [reportId])

  const isPendingRecommendation = (rec) => {
    const status = (rec?.status || '').toLowerCase().trim()
    return !hiddenStatuses.includes(status)
  }

  const visibleRecs = recs.filter((rec) => {
    const id = rec.id || rec._id
    return isPendingRecommendation(rec) && !handledIds.has(id)
  })

  const markHandled = (recId) => {
    setHandledIds((prev) => {
      const next = new Set(prev)
      next.add(recId)
      return next
    })
  }

  const doApprove = async (recId) => {
    markHandled(recId)

    try {
      await api.post(`/analysis/report/${reportId}/approve`, {
        action: 'approve', recommendation_ids: [recId],
      })
      onUpdate?.()
    } catch (error) {
      setHandledIds((prev) => {
        const next = new Set(prev)
        next.delete(recId)
        return next
      })
      console.error('Failed to approve recommendation', error)
    }
  }

  const doReject = async (recId, reason) => {
    markHandled(recId)

    try {
      await api.post(`/analysis/report/${reportId}/approve`, {
        action: 'reject', recommendation_ids: [recId], rejection_reason: reason,
      })
      onUpdate?.()
    } catch (error) {
      setHandledIds((prev) => {
        const next = new Set(prev)
        next.delete(recId)
        return next
      })
      console.error('Failed to reject recommendation', error)
    }
  }

  const approveAll = async () => {
    setBusy(true)
    const idsToHandle = recs.map((rec) => rec.id || rec._id).filter(Boolean)
    setHandledIds((prev) => {
      const next = new Set(prev)
      idsToHandle.forEach((id) => next.add(id))
      return next
    })

    try {
      await api.post(`/analysis/report/${reportId}/approve`, { action: 'approve_all' })
      onUpdate?.()
    } catch (error) {
      setHandledIds((prev) => {
        const next = new Set(prev)
        idsToHandle.forEach((id) => next.delete(id))
        return next
      })
      console.error('Failed to approve all recommendations', error)
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Next Best Actions</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {visibleRecs.length} recommendations · {stats.immediate || 0} immediate
            {report.status === 'awaiting_approval' && ' · Approve to add to Todos'}
          </p>
        </div>
        {['awaiting_approval', 'partially_approved'].includes((report.status || '').toLowerCase()) && visibleRecs.length > 0 && (
          <button onClick={approveAll} disabled={busy} className="btn-primary flex items-center gap-1.5 text-xs py-1.5">
            <CheckCircle size={12} />
            {busy ? 'Approving…' : 'Approve All'}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visibleRecs.map((rec, i) => (
          <RecCard
            key={rec.id || i}
            rec={rec}
            onApprove={doApprove}
            onReject={doReject}
            reportStatus={report.status}
          />
        ))}
      </div>
    </div>
  )
}
export default RecommendationsPanel