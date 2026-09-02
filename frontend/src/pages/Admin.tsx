import { useState, useEffect } from 'react'
import '../styles/admin.css'

interface User {
  id: string
  email: string
  created_at: string
}

interface UserChallenge {
  id: string
  status: string
  balance: number
  created_at: string
  user: { email: string }
  challenge: { name: string }
}

interface Stats {
  totalUsers: number
  activeChallenges: number
  passedChallenges: number
  failedChallenges: number
}

export default function Admin() {
  const [tab, setTab] = useState<'stats' | 'users' | 'challenges'>('stats')
  const [users, setUsers] = useState<User[]>([])
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchAllData()
  }, [tab])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      if (tab === 'stats') {
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setStats(data.stats)
        else setError(data.error)
      } else if (tab === 'users') {
        const res = await fetch(`${apiUrl}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setUsers(data.users)
        else setError(data.error)
      } else if (tab === 'challenges') {
        const res = await fetch(`${apiUrl}/api/admin/user-challenges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setUserChallenges(data.userChallenges)
        else setError(data.error)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Delete this challenge?')) return

    try {
      const res = await fetch(`${apiUrl}/api/admin/user-challenges/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setUserChallenges(userChallenges.filter(c => c.id !== id))
      } else {
        setError('Failed to delete')
      }
    } catch (err) {
      setError('Error deleting')
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Panel</h1>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${tab === 'stats' ? 'active' : ''}`}
          onClick={() => setTab('stats')}
        >
          Statistics
        </button>
        <button 
          className={`tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button 
          className={`tab ${tab === 'challenges' ? 'active' : ''}`}
          onClick={() => setTab('challenges')}
        >
          Challenges
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="admin-content">
          {tab === 'stats' && stats && (
            <div className="stats-grid">
              <div className="stat-box">
                <label>Total Users</label>
                <p className="stat-value">{stats.totalUsers}</p>
              </div>
              <div className="stat-box">
                <label>Active Challenges</label>
                <p className="stat-value">{stats.activeChallenges}</p>
              </div>
              <div className="stat-box">
                <label>Passed Challenges</label>
                <p className="stat-value positive">{stats.passedChallenges}</p>
              </div>
              <div className="stat-box">
                <label>Failed Challenges</label>
                <p className="stat-value negative">{stats.failedChallenges}</p>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'challenges' && (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Challenge</th>
                    <th>Status</th>
                    <th>Balance</th>
                    <th>Started</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userChallenges.map(uc => (
                    <tr key={uc.id}>
                      <td>{uc.user.email}</td>
                      <td>{uc.challenge.name}</td>
                      <td>
                        <span className={`status-badge ${uc.status}`}>
                          {uc.status}
                        </span>
                      </td>
                      <td>${uc.balance.toFixed(2)}</td>
                      <td>{new Date(uc.created_at).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteChallenge(uc.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}