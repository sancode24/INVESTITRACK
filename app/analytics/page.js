import { query, inr } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

function Table({ title, cols, rows }) {
  return (
    <>
      <h2>{title}</h2>
      <table>
        <thead><tr>{cols.map(([k, l, n]) => <th key={k} className={n ? 'num' : ''}>{l}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length}>No rows</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>{cols.map(([k, , n]) => <td key={k} className={n ? 'num' : ''}>{n ? inr(r[k]) : r[k]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default async function Analytics() {
  const sector = await query(
    `SELECT se.Sector_Name, ROUND(SUM(h.Quantity * s.Price), 2) AS Exposure
     FROM Holding h JOIN Stock s ON h.Stock_ID = s.Stock_ID JOIN Sector se ON s.Sector_ID = se.Sector_ID
     GROUP BY se.Sector_Name ORDER BY Exposure DESC`);
  const dividends = await query(
    `SELECT i.Name, ROUND(SUM(h.Quantity * d.Amount_Per_Share), 2) AS Dividend_Income
     FROM Investor i JOIN Portfolio p ON i.Investor_ID = p.Investor_ID
     JOIN Holding h ON p.Portfolio_ID = h.Portfolio_ID JOIN Dividend d ON h.Stock_ID = d.Stock_ID
     GROUP BY i.Investor_ID, i.Name ORDER BY Dividend_Income DESC`);
  const signals = await query(
    `SELECT i.Name, s.Symbol, w.Target_Price, s.Price AS Market_Price
     FROM Watchlist w JOIN Investor i ON w.Investor_ID = i.Investor_ID JOIN Stock s ON w.Stock_ID = s.Stock_ID
     WHERE s.Price <= w.Target_Price`);
  const brokers = await query(
    `SELECT b.Broker_Name, COUNT(*) AS Trades,
            ROUND(SUM(t.Quantity * t.Price * b.Commission_Rate / 100), 2) AS Commission_Paid
     FROM Trade t JOIN Broker b ON t.Broker_ID = b.Broker_ID GROUP BY b.Broker_ID, b.Broker_Name`);

  return (
    <>
      <h1>Analytics</h1>
      <Table title="Sector-wise Exposure" cols={[['Sector_Name', 'Sector'], ['Exposure', 'Exposure', true]]} rows={sector} />
      <Table title="Dividend Income per Investor" cols={[['Name', 'Investor'], ['Dividend_Income', 'Income', true]]} rows={dividends} />
      <Table title="Watchlist Buy Signals (price at or below target)"
             cols={[['Name', 'Investor'], ['Symbol', 'Symbol'], ['Target_Price', 'Target', true], ['Market_Price', 'Market', true]]} rows={signals} />
      <Table title="Brokerage Paid" cols={[['Broker_Name', 'Broker'], ['Trades', 'Trades'], ['Commission_Paid', 'Commission', true]]} rows={brokers} />
    </>
  );
}
