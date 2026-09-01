import { useState } from 'react'
import BalanceCard from '../components/Dashboard/BalanceCard'
import PortfolioChart from '../components/Dashboard/PortfolioChart'
import PositionsTable from '../components/Dashboard/PositionsTable'
import ChallengeCard from '../components/Dashboard/ChallengeCard'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [positions] = useState([
    { id: 1, symbol: 'BTC/USDT', entry: 78500, current: 78750, size: 0.01, pnl: 2.50, pnlPercent: 0.32 },
    { id: 2, symbol: 'ETH/USDT', entry: 2500, current: 2520, size: 0.5, pnl: 10.00, pnlPercent: 0.80 },
  ])

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, Trader</span>
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <main className="dashboard-content">
        <div className="cards-grid">
          <BalanceCard label="Account Balance" value={25000} currency="USDT" />
          <BalanceCard label="Current P&L" value={2500} currency="USDT" positive={true} />
          <BalanceCard label="Max Drawdown" value={2000} currency="USDT" />
          <BalanceCard label="Win Rate" value={65} currency="%" />
        </div>

        <PortfolioChart />

        <div className="positions-section">
          <h2>Open Positions</h2>
          <PositionsTable positions={positions} />
        </div>

        <div className="challenges-section">
          <h2>Active Challenges</h2>
          <div className="challenges-grid">
            <ChallengeCard 
              name="Starter Challenge"
              status="Active"
              profit={2500}
              target={10000}
              profitPercent={25}
            />
          </div>
        </div>
      </main>
    </div>
  )
}