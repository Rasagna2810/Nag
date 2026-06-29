import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, TrendingUp, Users, DollarSign,
  ArrowRight, Activity,
} from 'lucide-react'
import api from '../lib/api'

function StatCard({ icon: Icon, label, value, sub, accent = 'brand' }) {
  const styles = {
    brand:  'text-brand-500  bg-brand-500/10',
    red:    'text-red-400    bg-red-400/10',
    green:  'text-emerald-400 bg-emerald-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
  }
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${styles[accent]}`}>
          <Icon size={17} />
        </div>
      </div>
    </div>
  )
}

const STATUS_STYLE = {
  'At Risk':        'text-red-400    bg-red-400/10',
  'Healthy':        'text-emerald-400 bg-emerald-400/10',
  'Needs Attention':'text-yellow-400 bg-yellow-400/10',
}

function Dashboard() {
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/customers/')
      .then(r => setCustomers(r.data))
      .finally(() => setLoading(false))
  }, [])


  const arr     = customers.reduce((s, c) => s + (c.arr || 0), 0)
  const total   = customers.length || 1

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">Customer portfolio at a glance</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}         label="Total Customers" value={customers.length} accent="brand" />
      
        <StatCard
          icon={DollarSign}    label="Total ARR"   value={`$${(arr / 1000).toFixed(0)}K`} accent="brand"
        />
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">All Customers</h2>
          <button
            onClick={() => nav('/customers')}
            className="btn-ghost text-xs flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading…</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map(c => (
              <div
                key={c.id}
                onClick={() => nav(`/customers/${c.id}`)}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-3 cursor-pointer transition-colors"
              >
               
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.industry} · {c.csm}</div>
                </div>

                <div className="text-sm text-slate-300 flex-shrink-0">
                  ${((c.arr || 0) / 1000).toFixed(0)}K
                </div>

                <div className="text-xs text-slate-500 flex-shrink-0 hidden md:block">{c.tier}</div>

                <ArrowRight size={13} className="text-slate-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
export default Dashboard