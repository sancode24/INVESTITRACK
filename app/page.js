import { query, inr } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  // fn_portfolio_value is a MySQL stored function (stocks + mutual funds)
  const portfolios = await query(
    `SELECT p.Portfolio_ID, p.Portfolio_Name, i.Name AS Investor,
            fn_portfolio_value(p.Portfolio_ID) AS Total_Value
     FROM Portfolio p JOIN Investor i ON p.Investor_ID = i.Investor_ID
     ORDER BY Total_Value DESC`
  );
  const [counts] = await query(
    `SELECT (SELECT COUNT(*) FROM Investor) AS investors,
            (SELECT COUNT(*) FROM Trade) AS trades,
            (SELECT COUNT(*) FROM Stock) AS stocks`
  );
  const total = portfolios.reduce((s, p) => s + Number(p.Total_Value), 0);

  return (
    <>
      <h1>Dashboard</h1>
      <div className="kpis">
        <div className="card"><div className="label">Total Portfolio Value</div><div className="value">{inr(total)}</div></div>
        <div className="card"><div className="label">Investors</div><div className="value">{counts.investors}</div></div>
        <div className="card"><div className="label">Trades</div><div className="value">{counts.trades}</div></div>
        <div className="card"><div className="label">Stocks Tracked</div><div className="value">{counts.stocks}</div></div>
      </div>
      <h2>Portfolio Values</h2>
      <table>
        <thead><tr><th>Portfolio</th><th>Investor</th><th className="num">Current Value</th></tr></thead>
        <tbody>
          {portfolios.map((p) => (
            <tr key={p.Portfolio_ID}><td>{p.Portfolio_Name}</td><td>{p.Investor}</td><td className="num">{inr(p.Total_Value)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
