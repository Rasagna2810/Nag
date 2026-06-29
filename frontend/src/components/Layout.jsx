import { NavLink, useNavigate } from 'react-router-dom'
import { Brain, LayoutDashboard, Users, BookOpen, LogOut, Zap } from 'lucide-react'
import { useAuthStore } from '../store'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/todos', icon: Zap, label: 'Todos' },
  { to: '/knowledge', icon: BookOpen, label: 'Knowledge Base' },
]

function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const nav = useNavigate()

  const handleLogout = () => {
    logout()
    nav('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-2 border-r border-border flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border gap-2.5">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">NBA Platform</div>
            <div className="text-[10px] text-slate-500 leading-none mt-0.5">Decision Intelligence</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand-500/15 text-brand-500 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-surface-3'
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.avatar || user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-surface">
        {children}
      </main>
    </div>
  )
}
export default Layout