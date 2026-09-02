const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const https = require('https')

const app = express()

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

// Bybit price cache
let priceCache = {
  'BTC/USDT': 43000,
  'ETH/USDT': 2300,
  'BNB/USDT': 580
}

// Fetch prices from Bybit
const fetchBybitPrice = (symbol) => {
  return new Promise((resolve) => {
    const [base, quote] = symbol.split('/')
    const bybitSymbol = base + quote
    
    const url = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${bybitSymbol}`
    
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.result && json.result.list && json.result.list[0]) {
            const price = parseFloat(json.result.list[0].lastPrice)
            priceCache[symbol] = price
            resolve(price)
          } else {
            resolve(priceCache[symbol] || 0)
          }
        } catch (err) {
          resolve(priceCache[symbol] || 0)
        }
      })
    }).on('error', () => resolve(priceCache[symbol] || 0))
  })
}

// Update prices periodically
setInterval(async () => {
  for (const symbol of Object.keys(priceCache)) {
    await fetchBybitPrice(symbol)
  }
}, 10000)

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

// Get current prices
app.get('/api/prices', async (req, res) => {
  try {
    const symbols = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT']
    const prices = {}
    
    for (const symbol of symbols) {
      prices[symbol] = await fetchBybitPrice(symbol)
    }
    
    res.json({ prices })
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
    
    // Update P&L with current prices
    for (let order of data) {
      const currentPrice = await fetchBybitPrice(order.symbol)
      order.current_price = currentPrice
      
      if (order.side === 'buy') {
        order.pnl = (currentPrice - order.entry_price) * order.size
      } else {
        order.pnl = (order.entry_price - currentPrice) * order.size
      }
    }
    
    res.json({ orders: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

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