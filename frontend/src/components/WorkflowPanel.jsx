import clsx from 'clsx'
import {
  Brain, Database, Globe, Cpu, Lightbulb, FileText,
  CheckCircle, Loader, Clock,
} from 'lucide-react'

const META = {
  planner:            { icon: Brain,       label: 'Planner',            color: 'indigo', desc: 'Designs the workflow' },
  internal_knowledge: { icon: Database,    label: 'Internal Knowledge',  color: 'blue',   desc: 'MongoDB + Qdrant retrieval' },
  external_research:  { icon: Globe,       label: 'External Research',   color: 'purple', desc: 'Tavily web intelligence' },
  reasoning:          { icon: Cpu,         label: 'Reasoning',           color: 'orange', desc: 'Risk & opportunity analysis' },
  recommendation:     { icon: Lightbulb,   label: 'Recommendation',      color: 'yellow', desc: 'Next best actions' },
  report:             { icon: FileText,    label: 'Report',              color: 'green',  desc: 'Executive report' },
}

const COLORS = {
  indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', bar: 'bg-indigo-500' },
  blue:   { bg: 'bg-blue-500/20',   border: 'border-blue-500/50',   text: 'text-blue-400',   bar: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', bar: 'bg-purple-500' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', bar: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  green:  { bg: 'bg-emerald-500/20',border: 'border-emerald-500/50',text: 'text-emerald-400',bar: 'bg-emerald-500' },
}

function AgentNode({ name, status }) {
  const meta = META[name] || { icon: Brain, label: name, color: 'indigo', desc: '' }
  const c    = COLORS[meta.color]
  const Icon = meta.icon

  return (
    <div className={clsx(
      'border rounded-xl p-3 transition-all duration-300',
      status === 'complete' ? `${c.bg} ${c.border}` :
      status === 'running'  ? `bg-surface-3 ${c.border}` :
      'bg-surface-3 border-border opacity-40'
    )}>
      <div className="flex items-center gap-2.5">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', c.bg)}>
          <Icon size={14} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white leading-none">{meta.label}</div>
          <div className="text-[10px] text-slate-500 mt-0.5 leading-none">{meta.desc}</div>
        </div>
        {status === 'complete' && <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />}
        {status === 'running'  && <Loader      size={13} className={clsx(c.text, 'animate-spin flex-shrink-0')} />}
        {status === 'pending'  && <Clock       size={13} className="text-slate-600 flex-shrink-0" />}
      </div>
      {status === 'running' && (
        <div className="mt-2 h-0.5 bg-border rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full animate-pulse', c.bar)} style={{ width: '60%' }} />
        </div>
      )}
    </div>
  )
}

 function WorkflowPanel({ plan, currentAgent, agentStatuses, logs }) {
  const pipeline = ['planner', ...(plan.length
    ? plan
    : ['internal_knowledge', 'external_research', 'reasoning', 'recommendation', 'report']
  )]

  return (
    <div className="card h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain size={14} className="text-brand-500" />
        <span className="text-sm font-semibold text-white">Agent Workflow</span>
      </div>

      {/* Pipeline */}
      <div className="space-y-1.5">
        {pipeline.map((name, i) => (
          <div key={name}>
            <AgentNode
              name={name}
              status={
                name === currentAgent         ? 'running'
                : agentStatuses[name]         ? agentStatuses[name]
                : 'pending'
              }
            />
            {i < pipeline.length - 1 && (
              <div className="flex justify-center my-0.5">
                <div className="w-px h-2.5 bg-border" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          Live Logs
        </div>
        <div className="flex-1 bg-surface rounded-lg p-3 overflow-y-auto min-h-[120px] max-h-[200px] space-y-0.5">
          {logs.length === 0
            ? <div className="text-xs text-slate-600 italic">Waiting for analysis...</div>
            : logs.map((l, i) => (
                <div key={i} className={clsx(
                  'font-mono text-[10px] leading-relaxed',
                  l.startsWith('[Planner]')         ? 'text-indigo-400' :
                  l.startsWith('[InternalKnowledge]')? 'text-blue-400' :
                  l.startsWith('[ExternalResearch]') ? 'text-purple-400' :
                  l.startsWith('[Reasoning]')        ? 'text-orange-400' :
                  l.startsWith('[Recommendation]')   ? 'text-yellow-400' :
                  l.startsWith('[Report]')           ? 'text-emerald-400' :
                  l.startsWith('→')                  ? 'text-brand-400' :
                  l.startsWith('✓')                  ? 'text-emerald-400' :
                  l.startsWith('✗')                  ? 'text-red-400' :
                  'text-slate-400'
                )}>
                  {l}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
export default WorkflowPanel