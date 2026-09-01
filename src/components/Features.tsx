export default function Features() {
  return (
    <section className="features" id="features">
      <h2>Why YAYEX is Different</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Fixed Drawdown</h3>
          <p>No more trailing stop-outs. Your max loss is set from day one.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI Trading Coach</h3>
          <p>Real-time feedback on your positions, risk analysis, and optimization.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>AI Psychologist</h3>
          <p>Track confidence, manage win/loss streaks, build trading discipline.</p>
        </div>
      </div>
    </section>
  )
}