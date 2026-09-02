import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { ModuleSelect } from './pages/ModuleSelect'
import { JuiceLayout } from './components/layout/JuiceLayout'
import { JuiceSales } from './pages/juice/JuiceSales'
import { JuiceExpenses } from './pages/juice/JuiceExpenses'
import { SilageLayout } from './components/layout/SilageLayout'
import { SilageHarvests } from './pages/silage/SilageHarvests'
import { SilageIncome } from './pages/silage/SilageIncome'
import { Dashboard } from './pages/Dashboard'
import { Income } from './pages/Income'
import { Expenses } from './pages/Expenses'
import { Harvests } from './pages/Harvests'
import { Reports } from './pages/Reports'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { MODULE_SELECT_PATH } from './constants/modules'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <LoadingSpinner text="Loading..." />
      </div>
    )
  }

  if (user) {
    return <Navigate to={MODULE_SELECT_PATH} replace />
  }

  return children
}

function ThemedToaster() {
  return (
    <Toaster
      position="top-center"
      containerClassName="!top-[max(0.75rem,env(safe-area-inset-top))] sm:!top-4"
      toastOptions={{
        style: {
          background: 'var(--app-surface)',
          color: 'var(--app-text-primary)',
          border: '1px solid var(--app-border-strong)',
          borderRadius: '16px',
          fontSize: '13px',
        },
        success: {
          iconTheme: {
            primary: 'var(--app-accent)',
            secondary: 'var(--app-accent-contrast)',
          },
        },
      }}
    />
  )
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedToaster />
        <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path={MODULE_SELECT_PATH}
          element={
            <ProtectedRoute>
              <ModuleSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/juice"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <JuiceLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="sales" replace />} />
          <Route path="sales" element={<JuiceSales />} />
          <Route path="expenses" element={<JuiceExpenses />} />
        </Route>
        <Route
          path="/silage"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <SilageLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="harvests" replace />} />
          <Route path="harvests" element={<SilageHarvests />} />
          <Route path="income" element={<SilageIncome />} />
        </Route>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <AppLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="harvests" element={<Harvests />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="income" element={<Income />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to={MODULE_SELECT_PATH} replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
