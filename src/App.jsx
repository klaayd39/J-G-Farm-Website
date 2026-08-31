import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { ModuleSelect } from './pages/ModuleSelect'
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Toaster
      position="top-center"
      containerClassName="!top-[max(0.75rem,env(safe-area-inset-top))] sm:!top-4"
      toastOptions={{
        style: {
          background: isDark ? '#0a0a0a' : '#ffffff',
          color: isDark ? '#d7ffe0' : '#0f172a',
          border: isDark ? '1px solid rgba(215, 255, 224, 0.15)' : '1px solid rgba(15, 23, 42, 0.1)',
          borderRadius: '16px',
          fontSize: '13px',
        },
        success: {
          iconTheme: {
            primary: isDark ? '#d7ffe0' : '#15803d',
            secondary: isDark ? '#050505' : '#ffffff',
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
        <Route path="/juice/*" element={<Navigate to={MODULE_SELECT_PATH} replace />} />
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
