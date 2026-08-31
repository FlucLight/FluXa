import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QuickInput } from './components/QuickInput'
import { Sidebar } from './components/Sidebar'
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
  return (
    <ThemeProvider>
      <ToastProvider>
        <QueryClientProvider client={qc}>
          <BrowserRouter>
            <div className="flex h-screen overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)]">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <QuickInput />
                <main className="flex-1 overflow-y-auto">
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