import { useState } from 'react'

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
      setTimeout(() => setSubmitted(false), 3000)
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
          required
        />
        <button type="submit" className="btn-primary">Notify Me</button>
      </form>
      {submitted && <p className="success-msg">✓ Thanks! We'll notify you soon.</p>}
      <p className="offer-badge">🎁 Early bird: 50% off first €49 challenge</p>
    </section>
  )
}