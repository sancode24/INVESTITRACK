import { query, inr } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export default async function Holdings() {
  const rows = await query(`SELECT i.Name AS Investor, v.* FROM v_holding_pnl v
                            JOIN Investor i ON i.Investor_ID = v.Investor_ID
                            ORDER BY v.Investor_ID, v.Portfolio_Name`);
  return (
    <>
      <h1>Holdings &amp; Unrealised P&amp;L</h1>
      <table>
        <thead>
          <tr><th>Investor</th><th>Portfolio</th><th>Symbol</th><th className="num">Qty</th>
              <th className="num">Avg Buy</th><th className="num">Market</th>
              <th className="num">Invested</th><th className="num">Value</th>
              <th className="num">P&amp;L</th><th className="num">%</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const cls = Number(r.Unrealised_PnL) >= 0 ? 'good' : 'bad';
            return (
              <tr key={i}>
                <td>{r.Investor}</td><td>{r.Portfolio_Name}</td><td>{r.Symbol}</td>
                <td className="num">{r.Quantity}</td><td className="num">{inr(r.Avg_Buy_Price)}</td>
                <td className="num">{inr(r.Market_Price)}</td><td className="num">{inr(r.Invested)}</td>
                <td className="num">{inr(r.Current_Value)}</td>
                <td className={`num ${cls}`}>{inr(r.Unrealised_PnL)}</td>
                <td className={`num ${cls}`}>{r.PnL_Pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
