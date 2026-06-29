import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import clsx from 'clsx'
function Customers() {
  const [customers, setCustomers] = useState([])
  const [query,     setQuery]     = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.get('/customers/').then(r => setCustomers(r.data))
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.industry || '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Customers</h1>
          <p className="text-sm text-slate-400">{customers.length} accounts in portfolio</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          className="input w-full pl-9"
          placeholder="Search by name or industry…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        {filtered.map(c => {
          // const hs = c.health_score ?? 100
          // const strokeColor =
          //   hs < 60  ? '#f87171' :
          //   hs < 75  ? '#fbbf24' :
          //              '#34d399'

          return (
            <div
              key={c.id}
              onClick={() => nav(`/customers/${c.id}`)}
              className="card hover:border-brand-500/40 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                {/* SVG health ring */}
                {/* <div className="flex-shrink-0 relative w-12 h-12"> */}
                  {/* <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1e2336" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15" fill="none"
                      stroke={strokeColor}
                      strokeWidth="3"
                      strokeDasharray={`${hs * 0.942} 100`}
                      strokeLinecap="round"
                    />
                  </svg> */}
                  {/* <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                    {hs}
                  </span> */}
                {/* </div> */}

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-white">{c.name}</span>
                    {/* {hs < 60 && (
                      <span className="badge text-red-400 bg-red-400/10">
                        <AlertTriangle size={9} /> At Risk
                      </span>
                    )} */}
                    {/* {(c.tags || []).map(t => (
                      <span key={t} className="badge text-slate-400 bg-surface-3 border border-border text-[10px]">
                        {t}
                      </span>
                    ))} */}
                  </div>
                  <div className="text-xs text-slate-500">
                    {c.industry} · {c.tier} · CSM: {c.csm}
                  </div>
                </div>

                {/* ARR */}
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold text-white">${((c.arr||0)/1000).toFixed(0)}K</div>
                  <div className="text-xs text-slate-500">ARR</div>
                </div>

                {/* Contract */}
                <div className="text-right flex-shrink-0 hidden md:block">
                  <div className="text-[10px] text-slate-400">Contract ends</div>
                  <div className="text-xs font-medium text-slate-300">
                    {c.contract_end ? new Date(c.contract_end).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                <ArrowRight
                  size={15}
                  className="text-slate-600 group-hover:text-brand-500 transition-colors flex-shrink-0"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default Customers