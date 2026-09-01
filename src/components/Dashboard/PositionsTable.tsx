interface Position {
  id: number
  symbol: string
  entry: number
  current: number
  size: number
  pnl: number
  pnlPercent: number
}

interface Props {
  positions: Position[]
}

export default function PositionsTable({ positions }: Props) {
  return (
    <table className="positions-table">
      <thead>
        <tr>
          <th>Pair</th>
          <th>Entry</th>
          <th>Current</th>
          <th>Size</th>
          <th>P&L</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {positions.map(pos => (
          <tr key={pos.id}>
            <td><strong>{pos.symbol}</strong></td>
            <td>${pos.entry.toFixed(2)}</td>
            <td>${pos.current.toFixed(2)}</td>
            <td>{pos.size}</td>
            <td className={pos.pnl > 0 ? 'positive' : 'negative'}>
              ${pos.pnl.toFixed(2)}
            </td>
            <td className={pos.pnlPercent > 0 ? 'positive' : 'negative'}>
              {pos.pnlPercent.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}