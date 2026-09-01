interface Props {
  label: string
  value: number
  currency: string
  positive?: boolean
}

export default function BalanceCard({ label, value, currency, positive }: Props) {
  return (
    <div className="balance-card">
      <p className="card-label">{label}</p>
      <p className={`card-value ${positive ? 'positive' : ''}`}>
        {value.toLocaleString()} {currency}
      </p>
    </div>
  )
}