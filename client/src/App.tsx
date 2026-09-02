import { Suspense, lazy, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Footer } from './components/Footer'
import { QuickInput } from './components/QuickInput'
import { Sidebar } from './components/Sidebar'
import { MenuIcon } from './components/Icons'
import { ThemeProvider } from './components/ThemeContext'
import { ToastProvider } from './components/Toast'
import { ProfileProvider } from './components/ProfileContext'
import { useProfile } from './components/profile-context'

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Accounts = lazy(() => import('./pages/Accounts').then((m) => ({ default: m.Accounts })))
const Transactions = lazy(() => import('./pages/Transactions').then((m) => ({ default: m.Transactions })))
const Transfers = lazy(() => import('./pages/Transfers').then((m) => ({ default: m.Transfers })))
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })))
const Recurring = lazy(() => import('./pages/Recurring').then((m) => ({ default: m.Recurring })))
const Export = lazy(() => import('./pages/Export').then((m) => ({ default: m.Export })))
const RecentlyDeleted = lazy(() => import('./pages/RecentlyDeleted').then((m) => ({ default: m.RecentlyDeleted })))

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

function MobileLogo() {
  const { photoSrc } = useProfile()
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 overflow-hidden rounded-full">
        <img src={photoSrc} alt="FluXa" className="h-full w-full object-cover" />
      </div>
      <span className="font-display text-base font-bold tracking-tight text-[var(--color-ink)]">
        FluXa
      </span>
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ThemeProvider>
      <ToastProvider>
        <ProfileProvider>
          <QueryClientProvider client={qc}>
            <ErrorBoundary>
              <BrowserRouter>
            <div className="flex h-screen h-[100dvh] min-w-0 overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)]">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 md:hidden">
                  <MobileLogo />
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
                <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                  <div className="flex-1">
                    <Suspense
                      fallback={
                        <div className="flex min-h-[40vh] items-center justify-center">
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-focus)]" />
                        </div>
                      }
                    >
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/transfers" element={<Transfers />} />
                        <Route path="/budgets" element={<Budgets />} />
                        <Route path="/recurring" element={<Recurring />} />
                        <Route path="/export" element={<Export />} />
                        <Route path="/deleted" element={<RecentlyDeleted />} />
                      </Routes>
                    </Suspense>
                  </div>
                  <Footer />
                </main>
              </div>
            </div>
          </BrowserRouter>
          </ErrorBoundary>
          </QueryClientProvider>
          </ProfileProvider>
        </ToastProvider>
    </ThemeProvider>
  )
}