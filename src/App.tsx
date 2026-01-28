import './App.css'
import { useAuth } from './hooks/useAuth'
import AuthPage from './components/pages/AuthPage'
import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './components/pages/DashboardPage'
import BoardView from './components/features/board/BoardView'

function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/board/:boardId" element={<BoardView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
