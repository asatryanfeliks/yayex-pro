export default function PortfolioChart() {
  return (
    <div className="chart-card">
      <h2>Portfolio</h2>
      <div className="fake-chart">
        <svg viewBox="0 0 400 200" style={{ width: '100%', height: '200px' }}>
          <polyline
            points="10,150 50,120 100,140 150,100 200,90 250,110 300,70 350,80 390,60"
            fill="none"
            stroke="#d4af37"
            strokeWidth="2"
          />
          <polyline
            points="10,150 50,120 100,140 150,100 200,90 250,110 300,70 350,80 390,60"
            fill="url(#gradient)"
            opacity="0.2"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}