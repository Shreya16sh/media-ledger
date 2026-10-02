// This file's only job: open one shared connection to SQL Server
// and let every route "borrow" it instead of opening a new one each time.

const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,              // set to true if you're using Azure SQL
    trustServerCertificate: true // needed for local SQL Server dev
  }
};

// poolPromise resolves to a ready-to-use connection pool.
// We create it once and reuse it everywhere (this is best practice).
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server (MediaLedgerDB)');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Check your backend/.env file and make sure SQL Server is running.');
    process.exit(1);
  });

module.exports = { sql, poolPromise };
