const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

app.post('/api/waitlist', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    const { error } = await supabase
      .from('waitlist')
      .insert([{ email }])
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' })
      }
      throw error
    }
    res.json({ success: true, message: 'Email added to waitlist' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword }])
      .select()
    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already registered' })
      }
      throw error
    }
    const userId = data[0]?.id
    const token = jwt.sign({ email, id: userId }, JWT_SECRET, { expiresIn: '24h' })
    res.json({ success: true, token, user: { email, id: userId } })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const passwordMatch = await bcrypt.compare(password, data.password)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const token = jwt.sign({ email, id: data.id }, JWT_SECRET, { expiresIn: '24h' })
    res.json({ success: true, token, user: { email, id: data.id } })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { symbol, side, entry_price, size } = req.body
    const user_id = req.user.id
    if (!symbol || !side || !entry_price || !size) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        symbol,
        side,
        entry_price,
        size,
        current_price: entry_price,
        pnl: 0,
        status: 'open',
        user_id
      }])
      .select()
    if (error) throw error
    res.json({ success: true, order: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user_id)
    if (error) throw error
    res.json({ orders: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})
// Get all challenges
app.get('/api/challenges', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
    if (error) throw error
    res.json({ challenges: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Enroll in challenge
app.post('/api/user-challenges', verifyToken, async (req, res) => {
  try {
    const { challenge_id } = req.body
    const user_id = req.user.id

    if (!challenge_id) {
      return res.status(400).json({ error: 'Challenge ID required' })
    }

    const { data, error } = await supabase
      .from('user_challenges')
      .insert([{
        user_id,
        challenge_id,
        status: 'active',
        balance: 10000,
        max_balance: 10000
      }])
      .select()

    if (error) throw error
    res.json({ success: true, userChallenge: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user's active challenge
app.get('/api/user-challenges', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id

    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') throw error

    res.json({ userChallenge: data || null })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})