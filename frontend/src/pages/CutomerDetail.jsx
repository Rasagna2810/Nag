import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Zap, Mail, FileText, MessageSquare,
  AlertTriangle, RefreshCw, Calendar,
} from 'lucide-react'
import clsx from 'clsx'
import api, { createAnalysisWS } from '../lib/api'
import { useAuthStore } from '../store'
import WorkflowPanel from '../components/WorkflowPanel'
import RecommendationsPanel from '../components/RecommendationsPanel'
const INTERACTION_ICON  = { email: Mail, meeting_notes: MessageSquare, support_ticket: AlertTriangle, note: FileText }
const INTERACTION_COLOR = {
  email:          'text-blue-400   bg-blue-400/10',
  meeting_notes:  'text-purple-400 bg-purple-400/10',
  support_ticket: 'text-red-400    bg-red-400/10',
  note:           'text-slate-400  bg-slate-400/10',
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'text-xs px-3 py-2.5 border-b-2 transition-colors whitespace-nowrap',
        active
          ? 'border-brand-500 text-brand-500 font-medium'
          : 'border-transparent text-slate-400 hover:text-slate-100'
      )}
    >
      {children}
    </button>
  )
}

function normalizeReport(doc) {
  const reportData = doc?.report || {}
  return {
    ...reportData,
    ...doc,
    id: doc?.id || doc?._id || reportData?.id,
    recommendations: doc?.recommendations || reportData?.recommendations || [],
    recommendation_stats: reportData?.recommendation_stats || doc?.recommendation_stats || {},
    executive_summary: reportData?.executive_summary || doc?.executive_summary || null,
    summary: doc?.summary || reportData?.summary || '',
  }
}

 function CustomerDetail() {
  const { id } = useParams()
  const nav    = useNavigate()
  const { token } = useAuthStore()
  const [customer,     setCustomer]     = useState(null)
  const [interactions, setInteractions] = useState([])
  const [reports,      setReports]      = useState([])
  const [currentReport,   setCurrentReport]   = useState(null)
  const [currentReportId, setCurrentReportId] = useState(null)
  const [tab, setTab] = useState('overview')
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [logs,            setLogs]            = useState([])
  const [plan,            setPlan]            = useState([])
  const [agentStatuses,   setAgentStatuses]   = useState({})
  const [currentAgent,    setCurrentAgent]    = useState(null)
  const wsRef = useRef(null)

  const load = async () => {
    const [cRes, iRes, rRes] = await Promise.all([
      api.get(`/customers/${id}`),
      api.get(`/customers/${id}/interactions`),
      api.get(`/analysis/reports/${id}`),
    ])
    setCustomer(cRes.data)
    setInteractions(iRes.data)
    setReports(rRes.data)

    if (rRes.data?.length > 0) {
      const latest = rRes.data[0]
      setCurrentReport(normalizeReport(latest))
      setCurrentReportId(latest.id)
    }
  }

  useEffect(() => { load() }, [id])

  const startAnalysis = () => {
    if (analysisRunning) return
    setAnalysisRunning(true)
    setLogs([])
    setPlan([])
    setAgentStatuses({})
    setCurrentAgent(null)
    setTab('analysis')

    wsRef.current = createAnalysisWS(id, token, (event) => {
      const { type, agent, message, data } = event

      switch (type) {
        case 'start':
          setLogs(prev => [...prev, `▶ ${message}`])
          break

        case 'agent_start':
          setCurrentAgent(agent)
          setAgentStatuses(prev => ({ ...prev, [agent]: 'running' }))
          setLogs(prev => [...prev, `→ ${message}`])
          if (data?.plan) setPlan(data.plan)
          break

        case 'log':
          setLogs(prev => [...prev, message])
          break

        case 'agent_complete':
          setAgentStatuses(prev => ({ ...prev, [agent]: 'complete' }))
          setCurrentAgent(null)
          if (data?.plan) setPlan(data.plan)
          break

        case 'complete':
          setLogs(prev => [...prev, `✓ ${message}`])
          setCurrentAgent(null)
          break

        case 'report_ready':
          setAnalysisRunning(false)
          setLogs(prev => [...prev, `✓ Report saved (ID: ${data?.report_id})`])
          api.get(`/analysis/reports/${id}`).then(r => {
            setReports(r.data)
            if (r.data?.length > 0) {
              const latest = r.data[0]
              setCurrentReport(normalizeReport(latest))
              setCurrentReportId(latest.id)
              setTab('recommendations')
            }
          })
          break

        case 'error':
          setLogs(prev => [...prev, `✗ ERROR [${agent}]: ${message}`])
          if (agent === 'orchestrator') setAnalysisRunning(false)
          break

        case 'ws_closed':
          setAnalysisRunning(false)
          break

        default:
          if (data?.plan) setPlan(data.plan)
      }
    })
  }

  // const hc = (customer?.health_score ?? 100)
  // const healthColor =
  //   hc < 60  ? 'text-red-380' :
  //   hc < 75  ? 'text-yellow-400' :
  //              'text-emerald-400'

  if (!customer) {
    return <div className="p-8 text-slate-500 text-sm">Loading...</div>
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      <div className="px-6 py-4 border-b border-border flex items-center gap-4 flex-shrink-0">
        <button onClick={() => nav('/customers')} className="btn-ghost p-1.5">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white">{customer.name}</h1>
            {/* <span className={clsx('text-sm font-bold', healthColor)}>{hc}</span> */}
            <span className="text-xs text-slate-500">health</span>
          </div>
          <div className="text-xs text-slate-500">
            {customer.industry} · {customer.tier} · ${((customer.arr || 0) / 1000).toFixed(0)}K ARR
          </div>
        </div>
        <button
          onClick={startAnalysis}
          disabled={analysisRunning}
          className="btn-primary flex items-center gap-2 flex-shrink-0"
        >
          {analysisRunning
            ? <><RefreshCw size={13} className="animate-spin" /> Analyzing…</>
            : <><Zap size={13} /> Run AI Analysis</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border flex gap-0.5 flex-shrink-0 overflow-x-auto">
        <TabBtn active={tab === 'overview'}       onClick={() => setTab('overview')}>Overview</TabBtn>
        <TabBtn active={tab === 'interactions'}   onClick={() => setTab('interactions')}>
          Interactions ({interactions.length})
        </TabBtn>
        <TabBtn active={tab === 'analysis'}       onClick={() => setTab('analysis')}>Live Analysis</TabBtn>
        <TabBtn active={tab === 'recommendations'} onClick={() => setTab('recommendations')}>
          Recommendations
          {currentReport?.recommendations?.length
            ? ` (${currentReport.recommendations.length})`
            : ''}
        </TabBtn>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Account details */}
            <div className="card">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Account</div>
              <div className="space-y-2">
                {[
                  ['Industry',      customer.industry],
                  ['Tier',          customer.tier],
                  // ['Status',        customer.status],
                  ['CSM',           customer.csm],
                  ['ARR',           `$${((customer.arr||0)/1000).toFixed(0)}K`],
                  ['Contract End',  customer.contract_end ? new Date(customer.contract_end).toLocaleDateString() : 'N/A'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-slate-200 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contacts */}
            <div className="card">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Contacts</div>
              <div className="space-y-3">
                {(customer.contacts || []).map((c, i) => (
                  <div key={i}>
                    <div className="text-xs font-medium text-white">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{c.role}</div>
                    <a href={`mailto:${c.email}`} className="text-[10px] text-brand-500 hover:underline">{c.email}</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags + past reports */}
            <div className="card">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Tags</div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(customer.tags || []).map(t => (
                  <span key={t} className="badge text-slate-300 bg-surface-3 border border-border">{t}</span>
                ))}
              </div>

              {reports.length > 0 && (
                <>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Past Reports
                  </div>
                  <div className="space-y-1.5">
                    {reports.slice(0, 4).map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setCurrentReport(normalizeReport(r))
                          setCurrentReportId(r.id)
                          setTab('recommendations')
                        }}
                        className="w-full text-left p-2 rounded-lg bg-surface-3 hover:bg-border text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        <div className="font-medium">{new Date(r.created_at).toLocaleDateString()}</div>
                        <div className="text-slate-500 text-[10px]">
                          {r.status} · {r.recommendations?.length || 0} actions
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── INTERACTIONS ── */}
        {tab === 'interactions' && (
          <div className="space-y-3 max-w-3xl">
            {interactions.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8">No interactions yet.</div>
            )}
            {interactions.map(item => {
              const Icon  = INTERACTION_ICON[item.type]  || FileText
              const color = INTERACTION_COLOR[item.type] || 'text-slate-400 bg-slate-400/10'
              return (
                <div key={item.id} className="card">
                  <div className="flex gap-3">
                    <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={clsx('badge text-[10px]', color)}>
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.date?.slice(0, 10)}</span>
                        <span className="text-[10px] text-slate-500">· {item.author}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.content}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LIVE ANALYSIS ── */}
        {tab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <WorkflowPanel
                plan={plan}
                currentAgent={currentAgent}
                agentStatuses={agentStatuses}
                logs={logs}
              />
            </div>
            <div className="lg:col-span-2 card flex flex-col">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Full Log Stream
              </div>
              <div className="flex-1 bg-surface rounded-lg p-4 font-mono text-[11px] overflow-y-auto h-[500px] space-y-0.5">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">
                    {analysisRunning ? 'Starting…' : 'Click "Run AI Analysis" to begin.'}
                  </div>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className={clsx(
                      'leading-relaxed',
                      l.startsWith('✓') ? 'text-emerald-400' :
                      l.startsWith('→') ? 'text-brand-400'   :
                      l.startsWith('✗') ? 'text-red-400'     :
                      l.startsWith('▶') ? 'text-slate-300'   :
                      'text-slate-400'
                    )}>
                      {l}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RECOMMENDATIONS ── */}
        {tab === 'recommendations' && (
          <div className="max-w-3xl">
            {currentReport ? (
              <>
                {/* Executive summary banner */}
                {currentReport.executive_summary?.headline && (
                  <div className="card border-brand-500/30 bg-brand-500/5 mb-4">
                    <div className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider mb-2">
                      Executive Summary
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {currentReport.executive_summary.headline}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400">
                      {currentReport.executive_summary.risk_exposure && (
                        <span>
                          At risk:{' '}
                          <span className="text-red-400 font-medium">
                            {currentReport.executive_summary.risk_exposure}
                          </span>
                        </span>
                      )}
                      {currentReport.executive_summary.opportunity_value && (
                        <span>
                          Upside:{' '}
                          <span className="text-emerald-400 font-medium">
                            {currentReport.executive_summary.opportunity_value}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <RecommendationsPanel
                  report={currentReport}
                  reportId={currentReportId}
                  onUpdate={load}
                />
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 text-sm mb-4">No analysis yet for this customer.</p>
                <button onClick={startAnalysis} className="btn-primary flex items-center gap-2 mx-auto">
                  <Zap size={13} /> Run AI Analysis
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
export default CustomerDetail