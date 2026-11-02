import { query, inr } from '@/lib/mysql';
import TradeForm from './TradeForm';

export const dynamic = 'force-dynamic';

export default async function Trades() {
  const trades = await query(
    `SELECT t.Transaction_ID, t.Txn_Date, p.Portfolio_Name, s.Symbol, t.Txn_Type,
            t.Quantity, t.Price, b.Broker_Name,
            ROUND(t.Quantity * t.Price * b.Commission_Rate / 100, 2) AS Commission
     FROM Trade t
     JOIN Portfolio p ON t.Portfolio_ID = p.Portfolio_ID
     JOIN Stock s     ON t.Stock_ID = s.Stock_ID
     JOIN Broker b    ON t.Broker_ID = b.Broker_ID
     ORDER BY t.Txn_Date DESC, t.Transaction_ID DESC`
  );
  const portfolios = await query('SELECT Portfolio_ID, Portfolio_Name FROM Portfolio ORDER BY Portfolio_Name');
  const brokers = await query('SELECT Broker_ID, Broker_Name FROM Broker');
  const stocks = await query('SELECT Symbol FROM Stock ORDER BY Symbol');

  return (
    <>
      <h1>Trades</h1>
      <TradeForm portfolios={portfolios} brokers={brokers} stocks={stocks} />
      <h2>Trade History</h2>
      <table>
        <thead><tr><th>Date</th><th>Portfolio</th><th>Symbol</th><th>Type</th>
          <th className="num">Qty</th><th className="num">Price</th><th>Broker</th><th className="num">Commission</th></tr></thead>
        <tbody>
          {trades.map((t) => (
            <tr key={t.Transaction_ID}>
              <td>{t.Txn_Date}</td><td>{t.Portfolio_Name}</td><td>{t.Symbol}</td>
              <td className={t.Txn_Type === 'BUY' ? 'good' : 'bad'}>{t.Txn_Type}</td>
              <td className="num">{t.Quantity}</td><td className="num">{inr(t.Price)}</td>
              <td>{t.Broker_Name}</td><td className="num">{inr(t.Commission)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
