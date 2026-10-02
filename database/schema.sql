/* =========================================================
   MediaLedger - Media Invoice Tracker
   Database setup script for SQL Server (run in SSMS)
   =========================================================

   HOW TO USE:
   1. Open SQL Server Management Studio (SSMS).
   2. Connect to your local SQL Server instance.
   3. Open this file (File > Open > File...).
   4. Click "Execute" (or press F5).
   That's it - your database, tables, and sample data are ready.
========================================================= */

-- 1. Create the database (skip if it already exists)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MediaLedgerDB')
BEGIN
    CREATE DATABASE MediaLedgerDB;
END
GO

USE MediaLedgerDB;
GO

-- 2. Users table (for login)
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO
CREATE TABLE dbo.Users (
    UserId      INT IDENTITY(1,1) PRIMARY KEY,
    Username    NVARCHAR(50)  NOT NULL UNIQUE,
    Password    NVARCHAR(100) NOT NULL,   -- kept plain-text on purpose for a beginner project (see README)
    FullName    NVARCHAR(100) NOT NULL,
    CreatedAt   DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 3. Bookings table (a "booking" = a media placement, like an ad slot)
IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL DROP TABLE dbo.Bookings;
GO
CREATE TABLE dbo.Bookings (
    BookingId     INT IDENTITY(1,1) PRIMARY KEY,
    ClientName    NVARCHAR(100) NOT NULL,
    MediaChannel  NVARCHAR(50)  NOT NULL,   -- e.g. TV, Digital, Print, Radio
    Campaign      NVARCHAR(100) NOT NULL,
    BookingDate   DATE NOT NULL,
    Amount        DECIMAL(12,2) NOT NULL,
    Status        NVARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Confirmed, Cancelled
    CreatedAt     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 4. Invoices table (each invoice is billed against a booking)
IF OBJECT_ID('dbo.Invoices', 'U') IS NOT NULL DROP TABLE dbo.Invoices;
GO
CREATE TABLE dbo.Invoices (
    InvoiceId     INT IDENTITY(1,1) PRIMARY KEY,
    BookingId     INT NOT NULL FOREIGN KEY REFERENCES dbo.Bookings(BookingId),
    InvoiceNumber NVARCHAR(30) NOT NULL UNIQUE,
    InvoiceDate   DATE NOT NULL,
    Amount        DECIMAL(12,2) NOT NULL,
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Unpaid', -- Unpaid, Paid, Overdue
    CreatedAt     DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 5. Sample login user -> username: admin / password: admin123
INSERT INTO dbo.Users (Username, Password, FullName)
VALUES ('admin', 'admin123', 'Media Admin');
GO

-- 6. Sample bookings
INSERT INTO dbo.Bookings (ClientName, MediaChannel, Campaign, BookingDate, Amount, Status)
VALUES
('Lush Cosmetics', 'Digital', 'Summer Glow Launch', '2026-06-01', 250000.00, 'Confirmed'),
('Urban Threads', 'TV', 'Festive Collection', '2026-07-15', 480000.00, 'Pending'),
('Bright Foods', 'Print', 'Healthy Habits', '2026-08-10', 90000.00, 'Confirmed');
GO

-- 7. Sample invoices (linked to the bookings above by BookingId 1, 2, 3)
INSERT INTO dbo.Invoices (BookingId, InvoiceNumber, InvoiceDate, Amount, PaymentStatus)
VALUES
(1, 'INV-1001', '2026-06-05', 250000.00, 'Paid'),
(2, 'INV-1002', '2026-07-20', 480000.00, 'Unpaid'),
(3, 'INV-1003', '2026-08-15', 90000.00, 'Overdue');
GO

PRINT 'MediaLedger database is ready to go!';
