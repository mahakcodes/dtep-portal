import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck2,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  User,
  Bell,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const nav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/cycles', label: 'Test Cycles', icon: ClipboardList },
    { to: '/evaluations', label: 'Evaluations', icon: FileCheck2 },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-beige-100 bg-cream-100 transition-all duration-300 ease-out ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div className="flex h-18 items-center justify-between px-5 border-b border-beige-100/60">
        <div className={`flex items-center gap-2.5 transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none w-0' : 'opacity-100'}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-400 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-cream-100" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 18L13 6L18 18H8Z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="font-serif text-lg font-semibold tracking-tight text-charcoal-300 whitespace-nowrap">DTEP</span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-charcoal-100 transition-all duration-200 hover:bg-beige-100 hover:text-charcoal-300"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            strokeWidth={1.75}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-olive-400/10 text-olive-500'
                  : 'text-charcoal-100 hover:bg-beige-50 hover:text-charcoal-300'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-olive-400" aria-hidden />
              )}
              <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
              <span className={`truncate transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'}`}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className={`border-t border-beige-100/60 p-4 space-y-3 ${collapsed ? 'px-3' : ''}`}>
        <div className={`flex items-center gap-3 rounded-2xl p-2 transition-colors duration-200 hover:bg-beige-50 ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-olive-300 to-olive-400 text-sm font-semibold text-cream-100">
            <User className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className={`min-w-0 flex-1 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'}`}>
            <p className="truncate text-sm font-medium text-charcoal-300">{user?.name || 'Alex Morgan'}</p>
            <p className="truncate text-xs text-charcoal-50 capitalize">{user?.role || 'Test Manager'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-charcoal-100 transition-all duration-200 hover:bg-terracotta-50 hover:text-terracotta-400 ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
          <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100'}`}>
            Sign out
          </span>
        </button>
      </div>
    </aside>
  )
}
