# InvestiTrack – Investment Portfolio Database

DBMS Mini Project · Sanjana M Kulkarni (PES1UG24AM249) · Sakshi Kiran (PES1UG24AM242)

Next.js app on top of MySQL (portfolios, holdings, trades, dividends) and MongoDB (research notes, trade audit log).

## Prerequisites
Node.js 18+, MySQL 8 (or MariaDB 10.5+), MongoDB 6+ with `mongosh`.

## 1. Create the MySQL database
`db/investitrack.sql` is the single final SQL script (DDL, triggers, function, procedures, sample data, views, queries). It drops and recreates the `investitrack` database, so it is safe to re-run.

macOS / Linux / Windows cmd:
```bash
mysql -u root -p < db/investitrack.sql
```
Windows PowerShell (`<` does not work there):
```
mysql -u root -p
mysql> source C:/path/to/investitrack/db/investitrack.sql;
```
MySQL Workbench: File → Open SQL Script → Execute All (⚡).

Check: `USE investitrack; SHOW TABLES;` → 13 tables + 2 views.

## 2. Create the MongoDB database
```bash
mongosh < db/mongo_setup.js
```

## 3. Run the app
```bash
cp .env.example .env.local      # Windows: copy .env.example .env.local
# edit .env.local → set MYSQL_PASSWORD
npm install
npm run dev
```
Open http://localhost:3000

## Pages
Dashboard · Holdings (P&L) · Trades (place BUY/SELL) · Analytics · Notes (MongoDB)

## Database highlights
1:1, 1:N and M:N relationships · triggers (over-sell check, holding sync) · stored function `fn_portfolio_value` · procedures `sp_place_trade`, `sp_investor_report` · views `v_holding_pnl`, `Investor_Portfolios` · MongoDB collections `investor_notes` (JSON-schema validator, text index) and `trade_audit`
