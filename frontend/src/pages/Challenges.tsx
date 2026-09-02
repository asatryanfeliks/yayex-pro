import { useState, useEffect } from 'react'
import '../styles/challenges.css'

interface Challenge {
  id: string
  name: string
  price: number
  max_drawdown: number
  profit_target: number
  duration_days: number
}

interface UserChallenge {
  id: string
  challenge_id: string
  status: string
  balance: number
  max_balance: number
  challenge: Challenge
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchChallenges()
    fetchUserChallenge()
  }, [])

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/challenges`)
      const data = await response.json()
      if (response.ok) {
        setChallenges(data.challenges || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchUserChallenge = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/user-challenges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setUserChallenge(data.userChallenge)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (challengeId: string) => {
    setError('')
    try {
      const response = await fetch(`${apiUrl}/api/user-challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challenge_id: challengeId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to enroll')
      } else {
        setUserChallenge(data.userChallenge)
      }
    } catch (err) {
      setError('Error enrolling in challenge')
    }
  }

  if (loading) {
    return <div className="challenges-container"><p>Loading...</p></div>
  }

  return (
    <div className="challenges-container">
      {userChallenge ? (
        <div className="active-challenge">
          <h2>Active Challenge: {userChallenge.challenge.name}</h2>
          <div className="challenge-stats">
            <div className="stat">
              <label>Balance</label>
              <p className="value">${userChallenge.balance.toFixed(2)}</p>
            </div>
            <div className="stat">
              <label>Max Drawdown</label>
              <p className="value">{userChallenge.challenge.max_drawdown}%</p>
            </div>
            <div className="stat">
              <label>Profit Target</label>
              <p className="value">${userChallenge.challenge.profit_target}</p>
            </div>
            <div className="stat">
              <label>Days Left</label>
              <p className="value">{userChallenge.challenge.duration_days}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="challenges-grid">
          <h2>Choose Your Challenge</h2>
          <div className="cards">
            {challenges.map(challenge => (
              <div key={challenge.id} className="challenge-card">
                <h3>{challenge.name}</h3>
                <p className="price">€{challenge.price}</p>
                <div className="details">
                  <p><strong>Max Drawdown:</strong> {challenge.max_drawdown}%</p>
                  <p><strong>Profit Target:</strong> ${challenge.profit_target}</p>
                  <p><strong>Duration:</strong> {challenge.duration_days} days</p>
                </div>
                <button 
                  className="btn-enroll"
                  onClick={() => handleEnroll(challenge.id)}
                >
                  Enroll Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  )
}