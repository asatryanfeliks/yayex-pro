interface Props {
  name: string
  status: string
  profit: number
  target: number
  profitPercent: number
}

export default function ChallengeCard({ name, status, profit, target, profitPercent }: Props) {
  return (
    <div className="challenge-card">
      <h3>{name}</h3>
      <p className="status">{status}</p>
      <div className="challenge-stats">
        <div>
          <p className="label">Profit</p>
          <p className="value positive">${profit.toLocaleString()}</p>
        </div>
        <div>
          <p className="label">Target</p>
          <p className="value">${target.toLocaleString()}</p>
        </div>
      </div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${profitPercent}%` }}></div>
      </div>
      <p className="progress-text">{profitPercent}% to target</p>
    </div>
  )
}