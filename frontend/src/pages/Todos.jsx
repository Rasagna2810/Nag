import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, Clock, Target, User, AlertTriangle,
  TrendingUp, Shield, RefreshCw, ChevronDown, ChevronUp, Filter,
} from 'lucide-react'
import clsx from 'clsx'
import api from '../lib/api'

const PRIORITY_STYLE = {
  P1: 'text-red-400    bg-red-400/10    border-red-400/30',
  P2: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  P3: 'text-blue-400   bg-blue-400/10   border-blue-400/30',
}
const URGENCY_COLOR = {
  immediate:      'text-red-400',
  'this-week':    'text-orange-400',
  'this-month':   'text-yellow-400',
  'this-quarter': 'text-blue-400',
}
const CATEGORY_ICON = {
  'risk-mitigation': Shield,
  expansion:         TrendingUp,
  relationship:      User,
  technical:         AlertTriangle,
  strategic:         TrendingUp,
}
const STATUS_STYLE = {
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  done:      'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  cancelled: 'text-slate-400  bg-slate-400/10  border-slate-400/30',
}

function DoneModal({ todo, onConfirm, onClose }) {
  const [outcome, setOutcome] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-2 border border-border rounded-xl p-5 w-full max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={14} className="text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Mark as Done</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{todo.title}</p>
        <div className="bg-surface-3 rounded-lg px-3 py-2 mb-3 text-[10px] text-slate-400">
          <span className="text-slate-500">Expected: </span>{todo.expected_outcome}
        </div>
        <label className="text-[10px] text-slate-500 block mb-1">
          What actually happened? <span className="text-red-400">*</span>
        </label>
        <textarea
          className="input w-full text-xs h-20 resize-none mb-3"
          placeholder="Describe the actual outcome, results achieved, or what changed..."
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-xs border border-border px-3">Cancel</button>
          <button
            onClick={() => onConfirm(outcome)}
            disabled={!outcome.trim()}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 disabled:opacity-40"
          >
            <CheckCircle size={12} /> Mark Done
          </button>
        </div>
      </div>
    </div>
  )
}

function CancelModal({ todo, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-2 border border-border rounded-xl p-5 w-full max-w-md">
        <div className="flex items-center gap-2 mb-1">
          <XCircle size={14} className="text-red-400" />
          <h3 className="text-sm font-semibold text-white">Cancel Action</h3>
        </div>
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{todo.title}</p>
        <label className="text-[10px] text-slate-500 block mb-1">
          Reason for cancellation <span className="text-red-400">*</span>
        </label>
        <textarea
          className="input w-full text-xs h-20 resize-none mb-3"
          placeholder="Why is this action being cancelled? (e.g. customer resolved it themselves, no longer relevant...)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-xs border border-border px-3">Back</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition-colors"
          >
            <XCircle size={12} /> Cancel Action
          </button>
        </div>
      </div>
    </div>
  )
}

function TodoCard({ todo, onDone, onCancel }) {
  const [open,        setOpen]        = useState(false)
  const [doneModal,   setDoneModal]   = useState(false)
  const [cancelModal, setCancelModal] = useState(false)

  const Icon     = CATEGORY_ICON[todo.category] || TrendingUp
  const ts       = STATUS_STYLE[todo.todo_status] || STATUS_STYLE.pending
  const isPending= todo.todo_status === 'pending'

  return (
    <>
      {doneModal   && <DoneModal   todo={todo} onConfirm={v => { setDoneModal(false);   onDone(todo, v)   }} onClose={() => setDoneModal(false)}   />}
      {cancelModal && <CancelModal todo={todo} onConfirm={v => { setCancelModal(false); onCancel(todo, v) }} onClose={() => setCancelModal(false)} />}

      <div className={clsx(
        'border rounded-xl overflow-hidden transition-all',
        todo.todo_status === 'done'      ? 'border-emerald-500/30 bg-emerald-500/5' :
        todo.todo_status === 'cancelled' ? 'border-border bg-surface-2 opacity-60' :
        'border-border bg-surface-2'
      )}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
              todo.todo_status === 'done' ? 'bg-emerald-500/20' : 'bg-surface-3'
            )}>
              <Icon size={13} className={todo.todo_status === 'done' ? 'text-emerald-400' : 'text-slate-400'} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={clsx('badge border text-[10px]', ts)}>
                  {todo.todo_status === 'done'      && <><CheckCircle size={9}/> Done</>}
                  {todo.todo_status === 'cancelled' && <><XCircle size={9}/> Cancelled</>}
                  {todo.todo_status === 'pending'   && <><Clock size={9}/> Pending</>}
                </span>
                <span className={clsx('badge text-[10px]', PRIORITY_STYLE[todo.priority] || PRIORITY_STYLE.P2)}>
                  {todo.priority || 'P2'}
                </span>
                {todo.due_date && (
                  <span className={clsx('text-[10px]', URGENCY_COLOR[todo.urgency] || 'text-slate-500')}>
                    due {todo.due_date}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 truncate">{todo.customer_name}</span>
              </div>
              <div className="text-sm font-semibold text-white leading-snug mb-1">{todo.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{todo.description}</div>
              {todo.expected_outcome && (
                <div className="flex items-start gap-1.5 bg-surface-3 rounded-lg px-2.5 py-1.5 mt-2">
                  <Target size={10} className="text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Expected Outcome</div>
                    <div className="text-[10px] text-slate-200">{todo.expected_outcome}</div>
                  </div>
                </div>
              )}
              {todo.todo_status === 'done' && todo.outcome && (
                <div className="flex items-start gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 mt-2">
                  <CheckCircle size={10} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[9px] text-emerald-400 uppercase tracking-wider">Actual Outcome</div>
                    <div className="text-[10px] text-slate-200">{todo.outcome}</div>
                  </div>
                </div>
              )}
              {todo.todo_status === 'cancelled' && todo.cancellation_reason && (
                <div className="mt-2 text-[10px] text-slate-500 italic">
                  Cancelled: {todo.cancellation_reason}
                </div>
              )}
              {todo.done_at && (
                <div className="text-[9px] text-slate-600 mt-1">
                  Completed by {todo.done_by} · {todo.done_at?.slice(0,10)}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 ml-1">
              <button onClick={() => setOpen(!open)} className="btn-ghost p-1.5">
                {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
              {isPending && (
                <>
                  <button
                    onClick={() => setCancelModal(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Cancel action"
                  >
                    <XCircle size={13}/>
                  </button>
                  <button
                    onClick={() => setDoneModal(true)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                    title="Mark done"
                  >
                    <CheckCircle size={13}/>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {open && (
          <div className="border-t border-border px-4 py-3 space-y-2">
            {todo.execution_steps?.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Steps</div>
                <div className="space-y-1">
                  {todo.execution_steps.map((s, i) => (
                    <div key={i} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-brand-500 font-mono flex-shrink-0">{i+1}.</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {todo.success_metric && (
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Success Metric</div>
                <div className="text-xs text-slate-300">{todo.success_metric}</div>
              </div>
            )}
            <div className="flex gap-4 text-[10px] text-slate-500 pt-1 border-t border-border">
              {todo.owner    && <span><User size={9} className="inline mr-1"/>{todo.owner}</span>}
              {todo.report_date && <span>From report: {todo.report_date}</span>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Todos() {
  const [todos,    setTodos]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending')   // pending | done | cancelled | all
  const nav = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/analysis/todos')
      setTodos(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDone = async (todo, outcome) => {
    await api.post('/analysis/todos/done', {
      report_id:         todo.report_id,
      recommendation_id: todo.id,
      outcome,
    })
    await load()
  }

  const handleCancel = async (todo, reason) => {
    await api.post('/analysis/todos/cancel', {
      report_id:         todo.report_id,
      recommendation_id: todo.id,
      reason,
    })
    await load()
  }

  const filtered = filter === 'all'
    ? todos
    : todos.filter(t => t.todo_status === filter)

  const counts = {
    pending:   todos.filter(t => t.todo_status === 'pending').length,
    done:      todos.filter(t => t.todo_status === 'done').length,
    cancelled: todos.filter(t => t.todo_status === 'cancelled').length,
  }

  const filterBtns = [
    { key: 'pending',   label: `Pending (${counts.pending})` },
    { key: 'done',      label: `Done (${counts.done})` },
    { key: 'cancelled', label: `Cancelled (${counts.cancelled})` },
    { key: 'all',       label: `All (${todos.length})` },
  ]

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Action Todos</h1>
          <p className="text-sm text-slate-400">Approved recommendations — mark done or cancel with reason</p>
        </div>
        <button onClick={load} className="btn-ghost p-2 border border-border" title="Refresh">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        {filterBtns.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'text-xs px-3 py-2 border-b-2 transition-colors',
              filter === f.key
                ? 'border-brand-500 text-brand-500 font-medium'
                : 'border-transparent text-slate-400 hover:text-slate-100'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle size={28} className="text-slate-700 mx-auto mb-3" />
          <div className="text-sm text-slate-400 mb-1">
            {filter === 'pending' ? 'No pending actions' : `No ${filter} actions`}
          </div>
          <div className="text-xs text-slate-500">
            {filter === 'pending'
              ? 'Approve recommendations from a customer analysis to add them here'
              : 'Actions appear here once you approve them from a customer report'}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
          <RefreshCw size={14} className="animate-spin" /> Loading...
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {[...filtered]
            .sort((a, b) => {
              const pOrder = { P1: 0, P2: 1, P3: 2 }
              return (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1)
            })
            .map((todo, i) => (
              <TodoCard
                key={`${todo.report_id}-${todo.id || i}`}
                todo={todo}
                onDone={handleDone}
                onCancel={handleCancel}
              />
            ))
          }
        </div>
      )}
    </div>
  )
}