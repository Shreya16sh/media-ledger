const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/dashboard/summary
// One endpoint that gives the dashboard everything it needs in one call,
// instead of the frontend making several separate requests.
router.get('/summary', async (req, res) => {
  try {
    const pool = await poolPromise;

    const bookingsCount = await pool.request()
      .query('SELECT COUNT(*) AS count FROM Bookings');

    const invoicesCount = await pool.request()
      .query('SELECT COUNT(*) AS count FROM Invoices');

    const totalRevenue = await pool.request()
      .query("SELECT ISNULL(SUM(Amount), 0) AS total FROM Invoices WHERE PaymentStatus = 'Paid'");

    const outstanding = await pool.request()
      .query("SELECT ISNULL(SUM(Amount), 0) AS total FROM Invoices WHERE PaymentStatus != 'Paid'");

    const recentBookings = await pool.request()
      .query('SELECT TOP 5 * FROM Bookings ORDER BY CreatedAt DESC');

    res.json({
      totalBookings: bookingsCount.recordset[0].count,
      totalInvoices: invoicesCount.recordset[0].count,
      totalRevenue: totalRevenue.recordset[0].total,
      outstandingAmount: outstanding.recordset[0].total,
      recentBookings: recentBookings.recordset
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ message: 'Could not load dashboard summary.' });
  }
});

module.exports = router;
