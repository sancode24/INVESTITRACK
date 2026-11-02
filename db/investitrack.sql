-- =====================================================================
--  InvestiTrack : Investment Portfolio Database  (DBMS Mini Project)
--  Sanjana M Kulkarni (PES1UG24AM249) | Sakshi Kiran (PES1UG24AM242)
--  Target: MySQL 8.x  (also runs on MariaDB 10.5+)
--  Run:  mysql -u root -p < investitrack.sql
-- =====================================================================

DROP DATABASE IF EXISTS investitrack;
CREATE DATABASE investitrack;
USE investitrack;

-- =====================================================================
-- 1. DDL : TABLES
--    Relationships covered:
--      1:1  Investor  - KYC_Profile
--      1:N  Investor  - Portfolio, Sector - Stock, Exchange - Stock,
--           Stock - Dividend, Broker - Transaction
--      M:N  Portfolio - Stock        (via Holding)
--           Portfolio - Mutual_Fund  (via Fund_Investment)
--           Investor  - Stock        (via Watchlist)
-- =====================================================================

CREATE TABLE Investor (
    Investor_ID   INT          PRIMARY KEY AUTO_INCREMENT,
    Name          VARCHAR(50)  NOT NULL,
    Email         VARCHAR(100) NOT NULL UNIQUE,
    Phone         VARCHAR(15),
    DOB           DATE
);

-- 1:1 with Investor (UNIQUE FK enforces one KYC per investor)
CREATE TABLE KYC_Profile (
    KYC_ID         INT          PRIMARY KEY AUTO_INCREMENT,
    Investor_ID    INT          NOT NULL UNIQUE,
    Identity_Proof VARCHAR(20)  NOT NULL,          -- e.g. PAN number
    Address        VARCHAR(150),
    City           VARCHAR(50),
    Country        VARCHAR(50)  DEFAULT 'India',
    Risk_Profile   VARCHAR(15)  CHECK (Risk_Profile IN ('Low','Moderate','High')),
    FOREIGN KEY (Investor_ID) REFERENCES Investor(Investor_ID) ON DELETE CASCADE
);

CREATE TABLE Broker (
    Broker_ID       INT           PRIMARY KEY AUTO_INCREMENT,
    Broker_Name     VARCHAR(50)   NOT NULL UNIQUE,
    Commission_Rate DECIMAL(5,2)  NOT NULL CHECK (Commission_Rate >= 0)  -- percent
);

CREATE TABLE Sector (
    Sector_ID   INT         PRIMARY KEY AUTO_INCREMENT,
    Sector_Name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Stock_Exchange (
    Exchange_ID   INT         PRIMARY KEY AUTO_INCREMENT,
    Exchange_Name VARCHAR(50) NOT NULL UNIQUE,
    Country       VARCHAR(50)
);

CREATE TABLE Stock (
    Stock_ID      INT           PRIMARY KEY AUTO_INCREMENT,
    Company_Name  VARCHAR(50)   NOT NULL,
    Symbol        VARCHAR(10)   NOT NULL UNIQUE,
    Price         DECIMAL(10,2) NOT NULL,           -- current market price
    Sector_ID     INT,
    Exchange_ID   INT,
    CONSTRAINT chk_price CHECK (Price > 0),
    FOREIGN KEY (Sector_ID)   REFERENCES Sector(Sector_ID)           ON DELETE SET NULL,
    FOREIGN KEY (Exchange_ID) REFERENCES Stock_Exchange(Exchange_ID) ON DELETE SET NULL
);

CREATE TABLE Mutual_Fund (
    Fund_ID   INT           PRIMARY KEY AUTO_INCREMENT,
    Fund_Name VARCHAR(80)   NOT NULL UNIQUE,
    Category  VARCHAR(20)   CHECK (Category IN ('Equity','Debt','Hybrid','Index')),
    Fund_House VARCHAR(50),
    NAV       DECIMAL(10,2) NOT NULL CHECK (NAV > 0)
);

-- 1:N Investor -> Portfolio
CREATE TABLE Portfolio (
    Portfolio_ID   INT         PRIMARY KEY AUTO_INCREMENT,
    Investor_ID    INT         NOT NULL,
    Portfolio_Name VARCHAR(50) NOT NULL,
    Created_On     DATE        DEFAULT (CURRENT_DATE),
    UNIQUE (Investor_ID, Portfolio_Name),
    FOREIGN KEY (Investor_ID) REFERENCES Investor(Investor_ID) ON DELETE CASCADE
);

-- M:N Portfolio <-> Stock (current position; maintained by trigger)
CREATE TABLE Holding (
    Portfolio_ID  INT           NOT NULL,
    Stock_ID      INT           NOT NULL,
    Quantity      INT           NOT NULL CHECK (Quantity >= 0),
    Avg_Buy_Price DECIMAL(10,2) NOT NULL CHECK (Avg_Buy_Price >= 0),
    PRIMARY KEY (Portfolio_ID, Stock_ID),
    FOREIGN KEY (Portfolio_ID) REFERENCES Portfolio(Portfolio_ID) ON DELETE CASCADE,
    FOREIGN KEY (Stock_ID)     REFERENCES Stock(Stock_ID)
);

-- M:N Portfolio <-> Mutual_Fund
CREATE TABLE Fund_Investment (
    Portfolio_ID INT           NOT NULL,
    Fund_ID      INT           NOT NULL,
    Units        DECIMAL(12,3) NOT NULL CHECK (Units > 0),
    Buy_NAV      DECIMAL(10,2) NOT NULL CHECK (Buy_NAV > 0),
    PRIMARY KEY (Portfolio_ID, Fund_ID),
    FOREIGN KEY (Portfolio_ID) REFERENCES Portfolio(Portfolio_ID) ON DELETE CASCADE,
    FOREIGN KEY (Fund_ID)      REFERENCES Mutual_Fund(Fund_ID)
);

-- Every BUY/SELL of a stock (named Trade because TRANSACTION is a keyword)
CREATE TABLE Trade (
    Transaction_ID INT           PRIMARY KEY AUTO_INCREMENT,
    Portfolio_ID   INT           NOT NULL,
    Stock_ID       INT           NOT NULL,
    Broker_ID      INT           NOT NULL,
    Txn_Date       DATE          NOT NULL,
    Txn_Type       VARCHAR(4)    NOT NULL CHECK (Txn_Type IN ('BUY','SELL')),
    Quantity       INT           NOT NULL CHECK (Quantity > 0),
    Price          DECIMAL(10,2) NOT NULL CHECK (Price > 0),
    FOREIGN KEY (Portfolio_ID) REFERENCES Portfolio(Portfolio_ID) ON DELETE CASCADE,
    FOREIGN KEY (Stock_ID)     REFERENCES Stock(Stock_ID),
    FOREIGN KEY (Broker_ID)    REFERENCES Broker(Broker_ID)
);

-- 1:N Stock -> Dividend (declared per share)
CREATE TABLE Dividend (
    Dividend_ID      INT           PRIMARY KEY AUTO_INCREMENT,
    Stock_ID         INT           NOT NULL,
    Amount_Per_Share DECIMAL(8,2)  NOT NULL CHECK (Amount_Per_Share > 0),
    Record_Date      DATE          NOT NULL,
    UNIQUE (Stock_ID, Record_Date),
    FOREIGN KEY (Stock_ID) REFERENCES Stock(Stock_ID) ON DELETE CASCADE
);

-- M:N Investor <-> Stock
CREATE TABLE Watchlist (
    Investor_ID  INT           NOT NULL,
    Stock_ID     INT           NOT NULL,
    Target_Price DECIMAL(10,2),
    Added_On     DATE          DEFAULT (CURRENT_DATE),
    PRIMARY KEY (Investor_ID, Stock_ID),
    FOREIGN KEY (Investor_ID) REFERENCES Investor(Investor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Stock_ID)    REFERENCES Stock(Stock_ID)       ON DELETE CASCADE
);

CREATE INDEX idx_trade_portfolio ON Trade(Portfolio_ID, Txn_Date);

-- =====================================================================
-- 2. TRIGGERS : keep Holding in sync with Trade, block over-selling
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_before_trade
BEFORE INSERT ON Trade
FOR EACH ROW
BEGIN
    DECLARE held INT DEFAULT 0;
    IF NEW.Txn_Type = 'SELL' THEN
        SELECT COALESCE(SUM(Quantity),0) INTO held
        FROM Holding
        WHERE Portfolio_ID = NEW.Portfolio_ID AND Stock_ID = NEW.Stock_ID;
        IF held < NEW.Quantity THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient quantity to SELL';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_after_trade
AFTER INSERT ON Trade
FOR EACH ROW
BEGIN
    IF NEW.Txn_Type = 'BUY' THEN
        -- weighted-average buy price on repeat purchases
        INSERT INTO Holding (Portfolio_ID, Stock_ID, Quantity, Avg_Buy_Price)
        VALUES (NEW.Portfolio_ID, NEW.Stock_ID, NEW.Quantity, NEW.Price)
        ON DUPLICATE KEY UPDATE
            Avg_Buy_Price = ROUND((Quantity * Avg_Buy_Price + NEW.Quantity * NEW.Price)
                                  / (Quantity + NEW.Quantity), 2),
            Quantity      = Quantity + NEW.Quantity;
    ELSE
        UPDATE Holding
        SET Quantity = Quantity - NEW.Quantity
        WHERE Portfolio_ID = NEW.Portfolio_ID AND Stock_ID = NEW.Stock_ID;

        DELETE FROM Holding
        WHERE Portfolio_ID = NEW.Portfolio_ID AND Stock_ID = NEW.Stock_ID
          AND Quantity = 0;
    END IF;
END$$

-- =====================================================================
-- 3. FUNCTION + PROCEDURES
-- =====================================================================

-- Current market value of one portfolio (stocks + mutual funds)
CREATE FUNCTION fn_portfolio_value(p_id INT)
RETURNS DECIMAL(14,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE stock_val DECIMAL(14,2);
    DECLARE fund_val  DECIMAL(14,2);

    SELECT COALESCE(SUM(h.Quantity * s.Price),0) INTO stock_val
    FROM Holding h JOIN Stock s ON h.Stock_ID = s.Stock_ID
    WHERE h.Portfolio_ID = p_id;

    SELECT COALESCE(SUM(f.Units * m.NAV),0) INTO fund_val
    FROM Fund_Investment f JOIN Mutual_Fund m ON f.Fund_ID = m.Fund_ID
    WHERE f.Portfolio_ID = p_id;

    RETURN stock_val + fund_val;
END$$

-- Place a trade through the API instead of raw INSERT
CREATE PROCEDURE sp_place_trade(
    IN p_portfolio INT, IN p_symbol VARCHAR(10), IN p_broker INT,
    IN p_type VARCHAR(4), IN p_qty INT, IN p_price DECIMAL(10,2), IN p_date DATE)
BEGIN
    DECLARE v_stock INT;
    SELECT Stock_ID INTO v_stock FROM Stock WHERE Symbol = p_symbol;
    IF v_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unknown stock symbol';
    END IF;
    INSERT INTO Trade (Portfolio_ID, Stock_ID, Broker_ID, Txn_Date, Txn_Type, Quantity, Price)
    VALUES (p_portfolio, v_stock, p_broker, p_date, p_type, p_qty, p_price);
END$$

-- Full report for one investor
CREATE PROCEDURE sp_investor_report(IN p_investor INT)
BEGIN
    SELECT i.Name, p.Portfolio_Name,
           fn_portfolio_value(p.Portfolio_ID) AS Current_Value
    FROM Investor i JOIN Portfolio p ON i.Investor_ID = p.Investor_ID
    WHERE i.Investor_ID = p_investor;

    SELECT * FROM v_holding_pnl WHERE Investor_ID = p_investor;
END$$

DELIMITER ;

-- =====================================================================
-- 4. DML : SAMPLE DATA
-- =====================================================================

INSERT INTO Investor (Name, Email, Phone, DOB) VALUES
('Aarav Sharma',  'aarav@mail.com',  '9876543210', '1995-04-12'),
('Diya Rao',      'diya@mail.com',   '9845012345', '1998-09-23'),
('Kiran Patil',   'kiran@mail.com',  '9900112233', '1989-01-05'),
('Meera Iyer',    'meera@mail.com',  '9731122334', '2001-12-17'),
('Rohan Gupta',   'rohan@mail.com',  NULL,         '1993-07-30');

INSERT INTO KYC_Profile (Investor_ID, Identity_Proof, Address, City, Country, Risk_Profile) VALUES
(1, 'ABCPS1234K', '12 MG Road',          'Bengaluru', 'India', 'High'),
(2, 'BCDPR2345L', '45 Jayanagar 4th Blk','Bengaluru', 'India', 'Moderate'),
(3, 'CDEPP3456M', '7 FC Road',           'Pune',      'India', 'Low'),
(4, 'DEFPI4567N', '22 T Nagar',          'Chennai',   'India', 'High');
-- Rohan (5) has no KYC yet -> used to demo LEFT JOIN

INSERT INTO Broker (Broker_Name, Commission_Rate) VALUES
('Zerodha', 0.03), ('Groww', 0.05), ('Upstox', 0.04);

INSERT INTO Sector (Sector_Name) VALUES
('IT'), ('Banking'), ('Energy'), ('FMCG'), ('Automobile');

INSERT INTO Stock_Exchange (Exchange_Name, Country) VALUES
('NSE', 'India'), ('BSE', 'India');

INSERT INTO Stock (Company_Name, Symbol, Price, Sector_ID, Exchange_ID) VALUES
('Infosys',             'INFY',      1850.00, 1, 1),
('Tata Consultancy',    'TCS',       4100.00, 1, 1),
('HDFC Bank',           'HDFCBANK',  1620.00, 2, 1),
('ICICI Bank',          'ICICIBANK', 1240.00, 2, 2),
('Reliance Industries', 'RELIANCE',  2900.00, 3, 1),
('Hindustan Unilever',  'HINDUNILVR',2450.00, 4, 2),
('Tata Motors',         'TATAMOTORS', 980.00, 5, 1),
('Maruti Suzuki',       'MARUTI',   12500.00, 5, 1);

INSERT INTO Mutual_Fund (Fund_Name, Category, Fund_House, NAV) VALUES
('Parag Parikh Flexi Cap', 'Equity', 'PPFAS',   78.40),
('Nifty 50 Index Fund',    'Index',  'UTI',     165.20),
('HDFC Short Term Debt',   'Debt',   'HDFC AMC', 29.75),
('ICICI Balanced Advantage','Hybrid','ICICI Pru', 68.10);

INSERT INTO Portfolio (Investor_ID, Portfolio_Name, Created_On) VALUES
(1, 'Long Term Growth', '2024-01-10'),
(1, 'Trading',          '2024-03-15'),
(2, 'Retirement',       '2023-11-01'),
(3, 'Safe Income',      '2022-06-20'),
(4, 'Tech Bets',        '2024-05-05');

-- Trades (Holding is filled automatically by the trigger)
INSERT INTO Trade (Portfolio_ID, Stock_ID, Broker_ID, Txn_Date, Txn_Type, Quantity, Price) VALUES
(1, 1, 1, '2024-01-12', 'BUY',  20, 1500.00),
(1, 5, 1, '2024-01-15', 'BUY',  10, 2400.00),
(1, 1, 1, '2024-06-10', 'BUY',  10, 1650.00),   -- avg price recalculated
(2, 7, 2, '2024-03-20', 'BUY',  50,  900.00),
(2, 7, 2, '2024-08-02', 'SELL', 20, 1050.00),
(3, 3, 3, '2023-11-05', 'BUY',  30, 1550.00),
(3, 6, 3, '2023-12-01', 'BUY',  15, 2600.00),
(4, 4, 1, '2022-07-01', 'BUY',  40,  800.00),
(4, 3, 1, '2022-08-11', 'BUY',  25, 1450.00),
(5, 2, 2, '2024-05-10', 'BUY',   8, 3800.00),
(5, 1, 2, '2024-05-12', 'BUY',  15, 1450.00);

CALL sp_place_trade(5, 'TCS', 2, 'BUY', 2, 4000.00, '2024-09-01');

INSERT INTO Fund_Investment (Portfolio_ID, Fund_ID, Units, Buy_NAV) VALUES
(1, 1, 250.000, 62.00),
(3, 2, 300.000, 140.00),
(3, 4, 150.000, 60.00),
(4, 3, 1000.000, 27.50);

INSERT INTO Dividend (Stock_ID, Amount_Per_Share, Record_Date) VALUES
(1, 18.00, '2024-06-01'),
(1, 21.00, '2024-10-25'),
(3, 19.50, '2024-05-15'),
(4, 10.00, '2024-08-10'),
(5,  9.00, '2024-08-19'),
(6, 24.00, '2024-07-05');

INSERT INTO Watchlist (Investor_ID, Stock_ID, Target_Price) VALUES
(1, 2, 3900.00), (1, 6, 2300.00),
(2, 1, 1700.00), (2, 7, 1000.00),
(4, 5, 2800.00), (5, 3, 1500.00);

-- UPDATE / DELETE demo
UPDATE Stock SET Price = 1880.00 WHERE Symbol = 'INFY';
UPDATE Investor SET Phone = '9123456780' WHERE Investor_ID = 5;
DELETE FROM Watchlist WHERE Investor_ID = 5 AND Stock_ID = 3;

-- =====================================================================
-- 5. VIEWS
-- =====================================================================

CREATE VIEW Investor_Portfolios AS
SELECT i.Investor_ID, i.Name, p.Portfolio_ID, p.Portfolio_Name
FROM Investor i
JOIN Portfolio p ON i.Investor_ID = p.Investor_ID;

-- Unrealised profit/loss per stock holding
CREATE VIEW v_holding_pnl AS
SELECT p.Investor_ID, p.Portfolio_Name, s.Symbol, h.Quantity,
       h.Avg_Buy_Price, s.Price AS Market_Price,
       ROUND(h.Quantity * h.Avg_Buy_Price, 2)              AS Invested,
       ROUND(h.Quantity * s.Price, 2)                      AS Current_Value,
       ROUND(h.Quantity * (s.Price - h.Avg_Buy_Price), 2)  AS Unrealised_PnL,
       ROUND((s.Price - h.Avg_Buy_Price) / h.Avg_Buy_Price * 100, 2) AS PnL_Pct
FROM Holding h
JOIN Portfolio p ON h.Portfolio_ID = p.Portfolio_ID
JOIN Stock s     ON h.Stock_ID     = s.Stock_ID;

-- =====================================================================
-- 6. ANALYSIS QUERIES
-- =====================================================================

-- Q1. Investor-portfolio view
SELECT * FROM Investor_Portfolios;

-- Q2. Current holdings with P&L
SELECT * FROM v_holding_pnl ORDER BY Investor_ID, Portfolio_Name;

-- Q3. Total value of every portfolio (stocks + funds) via stored function
SELECT Portfolio_ID, Portfolio_Name, fn_portfolio_value(Portfolio_ID) AS Total_Value
FROM Portfolio
ORDER BY Total_Value DESC;

-- Q4. Mutual fund P&L
SELECT p.Portfolio_Name, m.Fund_Name, f.Units, f.Buy_NAV, m.NAV,
       ROUND(f.Units * (m.NAV - f.Buy_NAV), 2) AS Fund_PnL
FROM Fund_Investment f
JOIN Mutual_Fund m ON f.Fund_ID = m.Fund_ID
JOIN Portfolio p   ON f.Portfolio_ID = p.Portfolio_ID;

-- Q5. Dividend income per investor (on currently held quantity)
SELECT i.Name, ROUND(SUM(h.Quantity * d.Amount_Per_Share), 2) AS Dividend_Income
FROM Investor i
JOIN Portfolio p ON i.Investor_ID = p.Investor_ID
JOIN Holding h   ON p.Portfolio_ID = h.Portfolio_ID
JOIN Dividend d  ON h.Stock_ID = d.Stock_ID
GROUP BY i.Investor_ID, i.Name
ORDER BY Dividend_Income DESC;

-- Q6. Realised profit on SELL trades (sell price vs avg buy before the sale)
SELECT p.Portfolio_Name, s.Symbol, t.Quantity, t.Price AS Sell_Price,
       ROUND(t.Quantity * (t.Price -
             (SELECT SUM(b.Quantity * b.Price) / SUM(b.Quantity)
              FROM Trade b
              WHERE b.Portfolio_ID = t.Portfolio_ID AND b.Stock_ID = t.Stock_ID
                AND b.Txn_Type = 'BUY' AND b.Txn_Date <= t.Txn_Date)), 2) AS Realised_PnL
FROM Trade t
JOIN Portfolio p ON t.Portfolio_ID = p.Portfolio_ID
JOIN Stock s     ON t.Stock_ID = s.Stock_ID
WHERE t.Txn_Type = 'SELL';

-- Q7. Sector-wise exposure across all investors
SELECT se.Sector_Name, ROUND(SUM(h.Quantity * s.Price), 2) AS Exposure
FROM Holding h
JOIN Stock s   ON h.Stock_ID = s.Stock_ID
JOIN Sector se ON s.Sector_ID = se.Sector_ID
GROUP BY se.Sector_Name
ORDER BY Exposure DESC;

-- Q8. Brokerage paid per broker (HAVING demo)
SELECT b.Broker_Name, COUNT(*) AS Trades,
       ROUND(SUM(t.Quantity * t.Price * b.Commission_Rate / 100), 2) AS Commission_Paid
FROM Trade t JOIN Broker b ON t.Broker_ID = b.Broker_ID
GROUP BY b.Broker_ID, b.Broker_Name
HAVING COUNT(*) >= 1;

-- Q9. Watchlist stocks that hit/beat the investor's target (buy signal)
SELECT i.Name, s.Symbol, w.Target_Price, s.Price AS Market_Price
FROM Watchlist w
JOIN Investor i ON w.Investor_ID = i.Investor_ID
JOIN Stock s    ON w.Stock_ID = s.Stock_ID
WHERE s.Price <= w.Target_Price;

-- Q10. Investors without KYC (LEFT JOIN / anti-join)
SELECT i.Investor_ID, i.Name
FROM Investor i LEFT JOIN KYC_Profile k ON i.Investor_ID = k.Investor_ID
WHERE k.KYC_ID IS NULL;

-- Q11. Stocks nobody holds (NOT EXISTS)
SELECT s.Symbol, s.Company_Name
FROM Stock s
WHERE NOT EXISTS (SELECT 1 FROM Holding h WHERE h.Stock_ID = s.Stock_ID);

-- Q12. Investors whose total value is above the average portfolio value (nested subquery)
SELECT i.Name, ROUND(SUM(fn_portfolio_value(p.Portfolio_ID)), 2) AS Net_Worth
FROM Investor i JOIN Portfolio p ON i.Investor_ID = p.Investor_ID
GROUP BY i.Investor_ID, i.Name
HAVING Net_Worth > (SELECT AVG(fn_portfolio_value(Portfolio_ID)) FROM Portfolio);

-- Q13. Rank stocks by market price inside each sector (window function, MySQL 8)
SELECT se.Sector_Name, s.Symbol, s.Price,
       RANK() OVER (PARTITION BY se.Sector_ID ORDER BY s.Price DESC) AS Rank_In_Sector
FROM Stock s JOIN Sector se ON s.Sector_ID = se.Sector_ID;

-- Q14. Stored procedure report
CALL sp_investor_report(1);

-- Q15. Trigger check: over-selling is rejected (uncomment to see the error)
-- CALL sp_place_trade(2, 'TATAMOTORS', 2, 'SELL', 999, 1000.00, '2024-10-01');

-- =====================================================================
-- 7. DDL DEMO (ALTER / RENAME / CTAS / DROP) on a scratch copy,
--    so the main schema stays intact
-- =====================================================================
CREATE TABLE New_Investor AS SELECT * FROM Investor;
ALTER TABLE New_Investor ADD Address VARCHAR(100);
ALTER TABLE New_Investor ADD PRIMARY KEY (Investor_ID);
ALTER TABLE New_Investor DROP COLUMN Address;
ALTER TABLE New_Investor MODIFY Phone VARCHAR(20);
RENAME TABLE New_Investor TO Investor_Details;
DESCRIBE Investor_Details;
DROP TABLE Investor_Details;

SHOW TABLES;
