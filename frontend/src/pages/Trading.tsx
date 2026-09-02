import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../styles/trading.css'

interface Order {
  id: string
  symbol: string
  side: string
  entry_price: number
  size: number
  current_price: number
  pnl: number
  status: string
  created_at: string
}

interface Prices {
  [key: string]: number
}

export default function Trading() {
  const [symbol, setSymbol] = useState('BTC/USDT')
  const [side, setSide] = useState('buy')
  const [entryPrice, setEntryPrice] = useState('')
  const [size, setSize] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [prices, setPrices] = useState<Prices>({})
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchOrders()
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (prices[symbol]) {
      setChartData(prev => [...prev.slice(-59), {
        time: new Date().toLocaleTimeString(),
        price: prices[symbol]
      }])
    }
  }, [prices, symbol])

  const fetchPrices = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/prices`)
      const data = await response.json()
      if (response.ok) {
        setPrices(data.prices)
        setEntryPrice(data.prices[symbol]?.toFixed(2) || '')
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleOpenOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          symbol,
          side,
          entry_price: parseFloat(entryPrice),
          size: parseFloat(size)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to open order')
      } else {
        setSymbol('BTC/USDT')
        setSide('buy')
        setEntryPrice('')
        setSize('')
        fetchOrders()
      }
    } catch (err) {
      setError('Error opening order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="trading-container">
      <div className="trading-layout">
        <div className="trading-panel">
          <div className="price-ticker">
            <h3>Live Prices</h3>
            <div className="prices">
              {Object.entries(prices).map(([sym, price]) => (
                <div key={sym} className="price-item">
                  <span className="symbol">{sym}</span>
                  <span className="value">${price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="trading-form">
            <h2>Open Order</h2>
            <form onSubmit={handleOpenOrder}>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="BNB/USDT">BNB/USDT</option>
              </select>
              <select value={side} onChange={(e) => setSide(e.target.value)}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <input
                type="number"
                placeholder="Entry Price"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="Size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                step="0.001"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Opening...' : 'Open Order'}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        </div>

        <div className="trading-chart">
          <h3>{symbol} Price Chart</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="time" stroke="#999" />
                <YAxis stroke="#999" domain="dataMin - 100" />
                <Tooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#d4af37" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="loading">Loading chart...</p>
          )}
        </div>

        <div className="trading-positions">
          <h2>Open Positions</h2>
          {orders.length === 0 ? (
            <p className="empty">No open positions</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Current</th>
                  <th>Size</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className={order.side}>
                    <td>{order.symbol}</td>
                    <td>{order.side.toUpperCase()}</td>
                    <td>${order.entry_price.toFixed(2)}</td>
                    <td>${order.current_price.toFixed(2)}</td>
                    <td>{order.size}</td>
                    <td className={order.pnl > 0 ? 'positive' : 'negative'}>
                      ${order.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}