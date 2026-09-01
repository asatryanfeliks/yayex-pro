import './App.css'
import { useState } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard'>('home')

  return (
    <div className="app">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'home' ? <Home /> : <Dashboard />}
    </div>
  )
}