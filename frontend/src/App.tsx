import './App.css'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'

type Page = 'home' | 'dashboard' | 'login' | 'signup'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    setCurrentPage('dashboard')
  }

  const handleSignup = (newToken: string) => {
    setToken(newToken)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setCurrentPage('home')
  }

  const handleNavigate = (page: Page) => {
    if (page === 'dashboard' && !token) {
      setCurrentPage('login')
    } else {
      setCurrentPage(page)
    }
  }

  return (
    <div className="app">
      {token ? (
        <Header currentPage={currentPage} setCurrentPage={handleNavigate} onLogout={handleLogout} />
      ) : (
        <nav className="header">
          <div className="logo">YAYEX</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-login" onClick={() => setCurrentPage('login')}>
              Login
            </button>
            <button className="btn-signup" onClick={() => setCurrentPage('signup')}>
              Sign Up
            </button>
          </div>
        </nav>
      )}
      
      {currentPage === 'home' && !token && <Home />}
      {currentPage === 'login' && !token && <Login onLogin={handleLogin} />}
      {currentPage === 'signup' && !token && <Signup onSignup={handleSignup} />}
      {currentPage === 'dashboard' && token && <Dashboard />}
    </div>
  )
}