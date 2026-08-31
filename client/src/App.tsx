import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QuickInput } from './components/QuickInput'
import { Sidebar } from './components/Sidebar'
import { MenuIcon } from './components/Icons'
import { ThemeProvider } from './components/ThemeContext'
import { ToastProvider } from './components/Toast'
import { Budgets } from './pages/Budgets'
import { Dashboard } from './pages/Dashboard'
import { Export } from './pages/Export'
import { RecentlyDeleted } from './pages/RecentlyDeleted'
import { Recurring } from './pages/Recurring'
import { Transactions } from './pages/Transactions'
import { Transfers } from './pages/Transfers'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={qc}>
          <BrowserRouter>
            <div className="flex h-screen h-[100dvh] min-w-0 overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)]">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 md:hidden">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[var(--color-ink)] text-xs font-bold tracking-wider text-[var(--color-surface-raised)] font-display">
                      FX
                    </div>
                    <span className="font-display text-base font-bold tracking-tight text-[var(--color-ink)]">
                      FluXa
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Buka menu navigasi"
                    className="rounded-[6px] p-2 text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
                  >
                    <MenuIcon size={19} />
                  </button>
                </header>
                <QuickInput />
                <main className="min-w-0 flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/transfers" element={<Transfers />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/recurring" element={<Recurring />} />
                    <Route path="/export" element={<Export />} />
                    <Route path="/deleted" element={<RecentlyDeleted />} />
                  </Routes>
                </main>
              </div>
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}