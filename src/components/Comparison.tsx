export default function Comparison() {
  return (
    <section className="comparison" id="compare">
      <h2>How We Stack Up</h2>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>YAYEX</th>
            <th>FTMO</th>
            <th>Topstep</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Drawdown Type</strong></td>
            <td className="check">✓ Fixed</td>
            <td>Trailing</td>
            <td>Trailing</td>
          </tr>
          <tr>
            <td><strong>AI Coach</strong></td>
            <td className="check">✓ Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td><strong>AI Psychologist</strong></td>
            <td className="check">✓ Yes</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td><strong>Crypto Support</strong></td>
            <td className="check">✓ Yes</td>
            <td>No</td>
            <td>Limited</td>
          </tr>
          <tr>
            <td><strong>CIS-Friendly Payments</strong></td>
            <td className="check highlight">✓ Yes</td>
            <td>Complex</td>
            <td>Complex</td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}