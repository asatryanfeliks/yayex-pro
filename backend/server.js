const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})