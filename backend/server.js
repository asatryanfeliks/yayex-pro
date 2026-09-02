const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' })
})

// Email capture endpoint
app.post('/api/waitlist', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const { data, error } = await supabase
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

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword }])

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already registered' })
      }
      throw error
    }

    // Create JWT token
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' })

    res.json({ 
      success: true, 
      token,
      user: { email }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Find user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Compare password
console.log('Stored password hash:', data.password)
console.log('Entered password:', password)

const passwordMatch = await bcrypt.compare(password, data.password)
console.log('Password match result:', passwordMatch)

if (!passwordMatch) {
  return res.status(401).json({ error: 'Invalid credentials' })
}

    // Create JWT token
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' })

    res.json({ 
      success: true, 
      token,
      user: { email, id: data.id }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})
// Middleware to verify JWT
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

// Create order endpoint
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { symbol, side, entry_price, size } = req.body
    const user_id = req.user.email // или можно использовать user ID

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

    if (error) throw error

    res.json({ success: true, order: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user orders endpoint
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const user_email = req.user.email

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user_email)

    if (error) throw error

    res.json({ orders: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})