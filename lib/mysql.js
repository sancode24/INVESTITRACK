import mysql from 'mysql2/promise';

const g = globalThis;
export const pool =
  g._mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'investitrack',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
if (process.env.NODE_ENV !== 'production') g._mysqlPool = pool;

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export const inr = (n) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
