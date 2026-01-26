import './App.css'
import { useAuth } from './hooks/useAuth'
import AuthPage from './components/pages/AuthPage'
import DashboardPage from './components/pages/DashboardPage'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <DashboardPage />
  )
}

export default App
