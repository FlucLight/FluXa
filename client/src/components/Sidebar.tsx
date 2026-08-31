import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/transactions', label: 'Transaksi', icon: '⇅' },
  { to: '/transfers', label: 'Transfer', icon: '⇄' },
  { to: '/budgets', label: 'Budget', icon: '◎' },
  { to: '/recurring', label: 'Berulang', icon: '↻' },
  { to: '/export', label: 'Export / Backup', icon: '⤓' },
  { to: '/deleted', label: 'Terhapus', icon: '✕' },
]

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-[#FFFFFF] border-r border-[#DADAD6] flex flex-col justify-between p-3">
      <div className="flex flex-col gap-1">
        <div className="px-3 py-3 mb-2 flex items-center gap-2">
          <div className="w-5 h-5 bg-[#1B1C1F] rounded-[4px] flex items-center justify-center text-white text-xs font-bold font-display">
            F
          </div>
          <span className="text-[#1B1C1F] font-bold text-sm font-display tracking-tight">
            Finance
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#ECECE9] text-[#1B1C1F]'
                    : 'text-[#5A5C61] hover:bg-[#F5F5F3] hover:text-[#1B1C1F]'
                }`
              }
            >
              <span className="text-xs opacity-70 w-3.5 text-center">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-3 py-2 text-[11px] text-[#8B8D92] border-t border-[#DADAD6]">
        Personal Tracker
      </div>
    </aside>
  )
}