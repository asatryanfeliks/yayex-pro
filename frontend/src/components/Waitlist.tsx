import { useState } from 'react'

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email) {
      setError('Please enter your email')
      setLoading(false)
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSubmitted(true)
        setEmail('')
        setTimeout(() => setSubmitted(false), 3000)
      }
    } catch (err) {
      setError('Error submitting. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="waitlist-section">
      <h2>Join Our Founding Traders</h2>
      <p>Be part of YAYEX before launch. First 100 get 50% off your first challenge.</p>
      <form className="waitlist-form" onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Notify Me'}
        </button>
      </form>
      {error && <p className="error-msg">{error}</p>}
      {submitted && <p className="success-msg">✓ Thanks! We'll notify you soon.</p>}
      <p className="offer-badge">🎁 Early bird: 50% off first €49 challenge</p>
    </section>
  )
}