import { useState, useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
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

interface Candlestick {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function Trading() {
  const [symbol, setSymbol] = useState('BTC/USDT')
  const [side, setSide] = useState('buy')
  const [entryPrice, setEntryPrice] = useState('')
  const [size, setSize] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [prices, setPrices] = useState<Prices>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  const token = localStorage.getItem('token')

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        textColor: '#d4af37',
        background: { type: ColorType.Solid, color: '#1a1a1a' }
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    })

   const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444'
    })

    fetchCandlesticks(symbol, candleSeries, chart)

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [symbol])

  useEffect(() => {
    fetchOrders()
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCandlesticks = async (sym: string, candleSeries: any, chart: any) => {
    try {
      const response = await fetch(`${apiUrl}/api/candlesticks/${sym}`)
      const data = await response.json()
      
      if (response.ok && data.candlesticks && data.candlesticks.length > 0) {
        const formattedData = data.candlesticks.map((c: Candlestick) => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }))
        
        candleSeries.setData(formattedData)
        chart.timeScale().fitContent()
      }
    } catch (err) {
      console.error('Error fetching candlesticks:', err)
    }
  }

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
          <h3>{symbol} TradingView Chart</h3>
          <div ref={chartContainerRef} className="chart-container" />
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