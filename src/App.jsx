import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { WorkspaceProvider } from './lib/workspace'
import { useLang } from './lib/i18n'
import { ToastProvider } from './components/Toast'
import { Logo } from './components/Mycelium'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import FolderPage from './pages/FolderPage'
import TodoPage from './pages/TodoPage'
import SettingsPage from './pages/SettingsPage'

// Editor und Kalender sind die grössten Teile und werden erst bei Bedarf geladen
const NotePage = lazy(() => import('./pages/NotePage'))
const CalendarPage = lazy(() => import('./calendar/CalendarPage'))

function Splash() {
  return (
    <div className="grid h-dvh place-items-center">
      <Logo className="size-10 animate-pulse text-ink" />
    </div>
  )
}

function Protected() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <WorkspaceProvider key={user.uid}>
      <Layout />
    </WorkspaceProvider>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected />}>
        <Route index element={<Home />} />
        <Route path="n/:id" element={<Suspense><NotePage /></Suspense>} />
        <Route path="f/:id" element={<FolderPage />} />
        <Route path="todos" element={<TodoPage />} />
        <Route path="calendar" element={<Suspense><CalendarPage /></Suspense>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // Bei einem Sprachwechsel wird die Oberfläche neu aufgebaut, damit alle Texte und Datumsformate wechseln
  const lang = useLang()
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes key={lang} />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
