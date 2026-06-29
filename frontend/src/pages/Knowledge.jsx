import { useEffect, useState } from 'react'
import {
  Search, Plus, CheckCircle, Loader, Database,
  Trash2, FileText, AlertTriangle, Shield, BookOpen, RefreshCw,
} from 'lucide-react'
import api from '../lib/api'
import clsx from 'clsx'

const TYPE_META = {
  troubleshooting: { color: 'text-red-400    bg-red-400/10    border-red-400/20',    icon: AlertTriangle, label: 'Troubleshooting' },
  playbook:        { color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Shield,        label: 'Playbook' },
  article:         { color: 'text-blue-400   bg-blue-400/10   border-blue-400/20',   icon: FileText,      label: 'Article' },
  product_doc:     { color: 'text-green-400  bg-green-400/10  border-green-400/20',  icon: BookOpen,      label: 'Product Doc' },
}

function ArticleCard({ article, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false)
  const meta           = TYPE_META[article.type] || TYPE_META.article
  const Icon           = meta.icon
  const [text, bg, border] = meta.color.split(' ')

  return (
    <div className={clsx('border rounded-xl p-3 bg-surface-2', border)}>
      <div className="flex items-start gap-2.5">
        <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', bg)}>
          <Icon size={12} className={text} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-semibold text-white">{article.title}</span>
            <span className={clsx('badge text-[9px]', bg, text)}>{meta.label}</span>
            {article.score !== undefined && (
              <span className="text-[9px] text-slate-500 ml-auto">{Math.round(article.score * 100)}% match</span>
            )}
          </div>
          <p className={clsx('text-[10px] text-slate-400 leading-relaxed', expanded ? '' : 'line-clamp-2')}>
            {article.content}
          </p>
          {(article.content?.length ?? 0) > 120 && (
            <button onClick={() => setExpanded(v => !v)} className="text-[9px] text-brand-500 hover:text-brand-400 mt-0.5">
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <div className="text-[9px] text-slate-600 mt-1 font-mono truncate">id: {article.id}</div>
        </div>

        <button
          onClick={() => onDelete(article.id)}
          disabled={deleting === article.id}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40 flex-shrink-0"
          title="Delete"
        >
          {deleting === article.id ? <Loader size={11} className="animate-spin" /> : <Trash2 size={11} />}
        </button>
      </div>
    </div>
  )
}

export default function Knowledge() {
  const [articles,  setArticles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [deleting,  setDeleting]  = useState(null)
  const [clearBusy, setClearBusy] = useState(false)
  const [seeding,   setSeeding]   = useState(false)
  const [query,     setQuery]     = useState('')
  const [searchRes, setSearchRes] = useState(null)
  const [searching, setSearching] = useState(false)
  const [title,     setTitle]     = useState('')
  const [content,   setContent]   = useState('')
  const [type,      setType]      = useState('article')
  const [ingesting, setIngesting] = useState(false)
  const [justAdded, setJustAdded] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/knowledge/articles')
      setArticles(r.data.articles || [])
    } catch {
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const seed = async () => {
    setSeeding(true)
    try {
      await api.post('/knowledge/seed')
      await load()
    } finally {
      setSeeding(false)
    }
  }

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const r = await api.get(`/knowledge/search?q=${encodeURIComponent(query)}&limit=10`)
      setSearchRes(r.data)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => { setSearchRes(null); setQuery('') }

  const deleteOne = async (id) => {
    setDeleting(id)
    try {
      await api.delete(`/knowledge/articles/${id}`)
      setArticles(prev => prev.filter(a => a.id !== id))
      if (searchRes) setSearchRes(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const clearAll = async () => {
    if (!window.confirm(`Delete all ${articles.length} articles from Qdrant?`)) return
    setClearBusy(true)
    try {
      await api.delete('/knowledge/articles')
      setArticles([])
      setSearchRes(null)
    } finally {
      setClearBusy(false)
    }
  }

  const ingest = async () => {
    if (!title.trim() || !content.trim()) return
    setIngesting(true)
    try {
      await api.post('/knowledge/ingest', { title, content, type })
      setJustAdded(title)
      setTitle(''); setContent('')
      setTimeout(() => setJustAdded(''), 3000)
      await load()
    } finally {
      setIngesting(false)
    }
  }

  const displayList = searchRes !== null ? searchRes : articles

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Knowledge Base</h1>
          <p className="text-sm text-slate-400">
            {articles.length} 
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost p-2 border border-border" title="Refresh">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={seed}
            disabled={seeding}
            className="btn-ghost border border-border flex items-center gap-1.5 text-xs px-3"
          >
            {seeding ? <Loader size={12} className="animate-spin" /> : <Database size={12} />}
            Load Starter Articles
          </button>
          {articles.length > 0 && (
            <button
              onClick={clearAll}
              disabled={clearBusy}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-400/10 transition-colors"
            >
              {clearBusy ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Clear All
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                className="input w-full pl-8 text-xs"
                placeholder='Test retrieval (e.g. "Epic EHR fix", "renewal 45 day protocol")'
                value={query}
                onChange={e => { setQuery(e.target.value); if (!e.target.value) clearSearch() }}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <button onClick={search} disabled={searching || !query.trim()} className="btn-primary flex items-center gap-1.5 text-xs px-3">
              {searching ? <Loader size={12} className="animate-spin" /> : <Search size={12} />}
              Search
            </button>
            {searchRes && (
              <button onClick={clearSearch} className="btn-ghost text-xs border border-border px-3">Clear</button>
            )}
          </div>

          {searchRes !== null && (
            <div className="text-xs text-slate-400 bg-surface-3 border border-border rounded-lg px-3 py-2">
              <span className="text-white font-medium">{searchRes.length} articles</span> matched "{query}"
              {searchRes.length === 0
                ? ' — nothing above 0.20 threshold.'
                : ' — these would be injected into the Reasoning prompt for this query.'}
            </div>
          )}

          {!loading && displayList.length === 0 && (
            <div className="card text-center py-10">
              <Database size={24} className="text-slate-600 mx-auto mb-2" />
              <div className="text-sm text-slate-400 mb-1">
                {searchRes !== null ? 'No articles matched' : 'Knowledge base is empty'}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                {searchRes !== null
                  ? 'Try broader terms'
                  : 'Load starter articles or add your own below'}
              </div>
              {searchRes === null && (
                <button onClick={seed} disabled={seeding} className="btn-primary mx-auto flex items-center gap-1.5 text-xs">
                  {seeding ? <Loader size={12} className="animate-spin" /> : <Database size={12} />}
                  Load Starter Articles
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
              <Loader size={14} className="animate-spin" /> Loading...
            </div>
          )}

          {!loading && (
            <div className="space-y-2">
              {displayList.map((a, i) => (
                <ArticleCard key={a.id || i} article={a} onDelete={deleteOne} deleting={deleting} />
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-1.5 mb-4">
              <Plus size={13} className="text-brand-500" />
              <span className="text-xs font-semibold text-white">Add Article</span>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Title</label>
                <input
                  className="input w-full text-xs"
                  placeholder='e.g. "Salesforce Integration Guide"'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Type</label>
                <select className="input w-full text-xs" value={type} onChange={e => setType(e.target.value)}>
                  <option value="article">Knowledge Article</option>
                  <option value="playbook">Playbook</option>
                  <option value="product_doc">Product Documentation</option>
                  <option value="troubleshooting">Troubleshooting Guide</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-1 block">Content</label>
                <textarea
                  className="input w-full text-xs resize-none h-36"
                  placeholder="Be specific — product names, error codes, step numbers, thresholds. Specificity improves retrieval accuracy."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              <button
                onClick={ingest}
                disabled={ingesting || !title.trim() || !content.trim()}
                className="btn-primary w-full flex items-center justify-center gap-1.5 text-xs py-2.5"
              >
                {ingesting
                  ? <><Loader size={12} className="animate-spin" /> Embedding...</>
                  : <><Database size={12} /> Save to Qdrant</>
                }
              </button>
              {justAdded && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                  <CheckCircle size={11} /> "{justAdded}" indexed
                </div>
              )}
            </div>
          </div>

          {/* Score guide */}
          {/* <div className="card bg-surface-3 border-border">
            <div className="text-[10px] font-semibold text-slate-400 mb-2">Similarity threshold</div>
            <div className="space-y-1.5">
              {[
                { range: '≥ 0.70', label: 'Near-identical',          bar: 'bg-emerald-500', w: 'w-full' },
                { range: '0.40–0.70', label: 'Strong — retrieved',   bar: 'bg-blue-500',    w: 'w-3/4' },
                { range: '0.25–0.40', label: 'Weak — retrieved',     bar: 'bg-yellow-500',  w: 'w-1/2' },
                { range: '< 0.25',   label: 'Filtered out',          bar: 'bg-slate-600',   w: 'w-1/4' },
              ].map(s => (
                <div key={s.range} className="flex items-center gap-2">
                  <div className={clsx('h-1 rounded-full flex-shrink-0', s.bar, s.w)} style={{minWidth:'16px', maxWidth:'64px'}} />
                  <span className="text-[9px] font-mono text-slate-500 w-16 flex-shrink-0">{s.range}</span>
                  <span className="text-[9px] text-slate-500">{s.label}</span>
                </div>
              ))}
            </div> */}
          {/* </div> */}
        </div>
      </div>
    </div>
  )
}