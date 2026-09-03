const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const WebSocket = require('ws')

const app = express()

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

// Binance WebSocket data
let priceData = {
  'BTCUSDT': {
    current: 43000,
    candlesticks: [],
    ws: null
  },
  'ETHUSDT': {
    current: 2300,
    candlesticks: [],
    ws: null
  },
  'BNBUSDT': {
    current: 580,
    candlesticks: [],
    ws: null
  }
}

// Symbol mapping
const symbolMap = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'BNB/USDT': 'BNBUSDT'
}

const reverseSymbolMap = {
  'BTCUSDT': 'BTC/USDT',
  'ETHUSDT': 'ETH/USDT',
  'BNBUSDT': 'BNB/USDT'
}

// Connect to Binance WebSocket
const connectBinanceWebSocket = (binanceSymbol) => {
  const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol.toLowerCase()}@klines_1m`
  
  const ws = new WebSocket(wsUrl)

  ws.on('open', () => {
    console.log(`Connected to Binance WebSocket: ${binanceSymbol}`)
  })

  ws.on('message', (data) => {
    try {
      const json = JSON.parse(data)
      const candle = json.k

      const candleData = {
        time: Math.floor(candle.t / 1000),
        open: parseFloat(candle.o),
        high: parseFloat(candle.h),
        low: parseFloat(candle.l),
        close: parseFloat(candle.c),
        volume: parseFloat(candle.v)
      }

      priceData[binanceSymbol].current = candleData.close

      // Add or update last candle
      if (priceData[binanceSymbol].candlesticks.length === 0) {
        priceData[binanceSymbol].candlesticks.push(candleData)
      } else {
        const lastCandle = priceData[binanceSymbol].candlesticks[priceData[binanceSymbol].candlesticks.length - 1]
        if (lastCandle.time === candleData.time) {
          priceData[binanceSymbol].candlesticks[priceData[binanceSymbol].candlesticks.length - 1] = candleData
        } else {
          priceData[binanceSymbol].candlesticks.push(candleData)
        }
      }

      // Keep last 100 candles
      if (priceData[binanceSymbol].candlesticks.length > 100) {
        priceData[binanceSymbol].candlesticks.shift()
      }
    } catch (err) {
      console.error('Error parsing Binance data:', err)
    }
  })

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${binanceSymbol}:`, error)
  })

  ws.on('close', () => {
    console.log(`WebSocket closed for ${binanceSymbol}, reconnecting in 5s...`)
    setTimeout(() => connectBinanceWebSocket(binanceSymbol), 5000)
  })

  priceData[binanceSymbol].ws = ws
}

// Connect to all symbols on startup
Object.keys(priceData).forEach(symbol => {
  connectBinanceWebSocket(symbol)
})

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
app.get('/api/prices', (req, res) => {
  try {
    const prices = {
      'BTC/USDT': priceData['BTCUSDT'].current,
      'ETH/USDT': priceData['ETHUSDT'].current,
      'BNB/USDT': priceData['BNBUSDT'].current
    }
    res.json({ prices })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get candlesticks
app.get('/api/candlesticks/:symbol', (req, res) => {
  try {
    const { symbol } = req.params
    const binanceSymbol = symbolMap[symbol]

    if (!binanceSymbol) {
      return res.status(400).json({ error: 'Invalid symbol' })
    }

    const candlesticks = priceData[binanceSymbol].candlesticks
    res.json({ candlesticks })
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
      const binanceSymbol = symbolMap[order.symbol]
      const currentPrice = priceData[binanceSymbol].current
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

// P&L calculation
const calculateUserChallengePnL = async (user_id, challenge_id) => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'open')

    let totalPnL = 0

    for (let order of orders) {
      const binanceSymbol = symbolMap[order.symbol]
      const currentPrice = priceData[binanceSymbol].current

      if (order.side === 'buy') {
        order.pnl = (currentPrice - order.entry_price) * order.size
      } else {
        order.pnl = (order.entry_price - currentPrice) * order.size
      }

      totalPnL += order.pnl
    }

    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()

    const { data: userChallenge } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user_id)
      .eq('challenge_id', challenge_id)
      .eq('status', 'active')
      .single()

    if (!userChallenge) {
      return { pnl: totalPnL, status: 'no_challenge' }
    }

    const currentBalance = userChallenge.balance + totalPnL
    const initialBalance = 10000
    const drawdown = ((initialBalance - currentBalance) / initialBalance) * 100

    let newStatus = userChallenge.status

    if (drawdown > challenge.max_drawdown) {
      newStatus = 'failed'
      await supabase
        .from('user_challenges')
        .update({
          status: newStatus,
          balance: currentBalance,
          ended_at: new Date().toISOString()
        })
        .eq('id', userChallenge.id)
    } else if (totalPnL >= challenge.profit_target) {
      newStatus = 'passed'
      await supabase
        .from('user_challenges')
        .update({
          status: newStatus,
          balance: currentBalance,
          ended_at: new Date().toISOString()
        })
        .eq('id', userChallenge.id)
    } else {
      await supabase
        .from('user_challenges')
        .update({
          balance: currentBalance,
          max_balance: Math.max(userChallenge.max_balance, currentBalance)
        })
        .eq('id', userChallenge.id)
    }

    return {
      pnl: totalPnL,
      balance: currentBalance,
      drawdown: drawdown,
      status: newStatus,
      profitTarget: challenge.profit_target,
      maxDrawdown: challenge.max_drawdown,
      passed: newStatus === 'passed',
      failed: newStatus === 'failed'
    }
  } catch (error) {
    console.error('Error calculating P&L:', error)
    throw error
  }
}

app.get('/api/challenge-status', verifyToken, async (req, res) => {
  try {
    const user_id = req.user.id
    const { challenge_id } = req.query

    if (!challenge_id) {
      return res.status(400).json({ error: 'Challenge ID required' })
    }

    const pnlData = await calculateUserChallengePnL(user_id, challenge_id)
    res.json(pnlData)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin routes
const isAdmin = (req, res, next) => {
  if (req.user.email === 'felix@gmail.com') {
    next()
  } else {
    res.status(403).json({ error: 'Admin access required' })
  }
}

app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ users: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/user-challenges', verifyToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        user:users(email),
        challenge:challenges(name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ userChallenges: data })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeChallenges } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: passedChallenges } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'passed')

    const { count: failedChallenges } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    res.json({
      stats: {
        totalUsers: usersCount || 0,
        activeChallenges: activeChallenges || 0,
        passedChallenges: passedChallenges || 0,
        failedChallenges: failedChallenges || 0
      }
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/admin/user-challenges/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('user_challenges')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})