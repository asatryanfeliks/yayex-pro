import { useState, useEffect } from 'react'
import '../styles/challenge-status.css'

interface PnLData {
  pnl: number
  balance: number
  drawdown: number
  status: string
  profitTarget: number
  maxDrawdown: number
  passed: boolean
  failed: boolean
}

export default function ChallengeStatus() {
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userChallenge, setUserChallenge] = useState<any>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchChallengeData()
    const interval = setInterval(fetchChallengeData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchChallengeData = async () => {
    try {
      // Get active challenge
      const challengeRes = await fetch(`${apiUrl}/api/user-challenges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const challengeData = await challengeRes.json()

      if (!challengeData.userChallenge) {
        setUserChallenge(null)
        setLoading(false)
        return
      }

      setUserChallenge(challengeData.userChallenge)

      // Get P&L status
      const pnlRes = await fetch(
        `${apiUrl}/api/challenge-status?challenge_id=${challengeData.userChallenge.challenge_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      const pnlData = await pnlRes.json()
      setPnlData(pnlData)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load challenge data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="challenge-status">Loading...</div>

  if (!userChallenge) {
    return <div className="challenge-status"><p>No active challenge</p></div>
  }

  if (!pnlData) return <div className="challenge-status">Loading...</div>

  const profitProgress = (pnlData.pnl / pnlData.profitTarget) * 100
  const drawdownProgress = (pnlData.drawdown / pnlData.maxDrawdown) * 100

  return (
    <div className="challenge-status">
      <div className={`status-header ${pnlData.status}`}>
        <h2>{userChallenge.challenge.name} Challenge</h2>
        <span className={`status-badge ${pnlData.status}`}>
          {pnlData.status.toUpperCase()}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <label>Current P&L</label>
          <p className={`value ${pnlData.pnl > 0 ? 'positive' : 'negative'}`}>
            ${pnlData.pnl.toFixed(2)}
          </p>
        </div>

        <div className="stat-card">
          <label>Current Balance</label>
          <p className="value">${pnlData.balance.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <label>Drawdown</label>
          <p className={`value ${pnlData.drawdown > pnlData.maxDrawdown ? 'danger' : ''}`}>
            {pnlData.drawdown.toFixed(2)}%
          </p>
        </div>

        <div className="stat-card">
          <label>Max Drawdown Allowed</label>
          <p className="value">{pnlData.maxDrawdown}%</p>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-item">
          <div className="progress-header">
            <label>Profit Target: ${pnlData.profitTarget}</label>
            <span>{Math.min(profitProgress, 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill positive" 
              style={{ width: `${Math.min(profitProgress, 100)}%` }}
            />
          </div>
        </div>

        <div className="progress-item">
          <div className="progress-header">
            <label>Max Drawdown: {pnlData.maxDrawdown}%</label>
            <span>{Math.min(drawdownProgress, 100).toFixed(0)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${drawdownProgress > 100 ? 'danger' : 'warning'}`}
              style={{ width: `${Math.min(drawdownProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {pnlData.passed && (
        <div className="alert success">
          ✓ Challenge Passed! You reached the profit target.
        </div>
      )}

      {pnlData.failed && (
        <div className="alert danger">
          ✗ Challenge Failed! Drawdown limit exceeded.
        </div>
      )}

      {error && <div className="alert error">{error}</div>}
    </div>
  )
}