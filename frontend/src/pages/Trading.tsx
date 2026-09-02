import { useState, useEffect } from 'react'
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

export default function Trading() {
  const [symbol, setSymbol] = useState('BTC/USDT')
  const [side, setSide] = useState('buy')
  const [entryPrice, setEntryPrice] = useState('')
  const [size, setSize] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchOrders()
  }, [])

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
      console.error('Error fetching orders:', err)
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
        <div className="trading-form">
          <h2>Open Order</h2>
          <form onSubmit={handleOpenOrder}>
            <input
              type="text"
              placeholder="Symbol (BTC/USDT)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
            />
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