const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/invoices?search=INV-1001
// Joins with Bookings so we can show the client name next to each invoice.
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
      SELECT i.*, b.ClientName, b.Campaign
      FROM Invoices i
      JOIN Bookings b ON i.BookingId = b.BookingId`;

    if (search) {
      query += ` WHERE i.InvoiceNumber LIKE @search
                 OR b.ClientName LIKE @search
                 OR i.PaymentStatus LIKE @search`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    query += ' ORDER BY i.InvoiceDate DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ message: 'Could not fetch invoices.' });
  }
});

// GET /api/invoices/bookings-list
// Small helper endpoint: gives the frontend a dropdown list of bookings
// to attach a new invoice to. (Placed before "/:id" so it isn't
// mistaken for an invoice id.)
router.get('/bookings-list', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT BookingId, ClientName, Campaign FROM Bookings ORDER BY ClientName');
    res.json(result.recordset);
  } catch (err) {
    console.error('Get bookings list error:', err);
    res.status(500).json({ message: 'Could not fetch bookings list.' });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT i.*, b.ClientName, b.Campaign
              FROM Invoices i JOIN Bookings b ON i.BookingId = b.BookingId
              WHERE i.InvoiceId = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get invoice error:', err);
    res.status(500).json({ message: 'Could not fetch invoice.' });
  }
});

// POST /api/invoices
// Body: { bookingId, invoiceNumber, invoiceDate, amount, paymentStatus }
router.post('/', async (req, res) => {
  const { BookingId, InvoiceNumber, InvoiceDate, Amount, PaymentStatus } = req.body;

  if (!BookingId || !InvoiceNumber || !InvoiceDate || Amount === undefined || Amount === null) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('bookingId', sql.Int, BookingId)
      .input('invoiceNumber', sql.NVarChar, InvoiceNumber)
      .input('invoiceDate', sql.Date, InvoiceDate)
      .input('amount', sql.Decimal(12, 2), Amount)
      .input('paymentStatus', sql.NVarChar, PaymentStatus || 'Unpaid')
      .query(`INSERT INTO Invoices (BookingId, InvoiceNumber, InvoiceDate, Amount, PaymentStatus)
              OUTPUT INSERTED.*
              VALUES (@bookingId, @invoiceNumber, @invoiceDate, @amount, @paymentStatus)`);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    // Invoice numbers must be unique - give a friendly message for that case.
    if (err.number === 2627) {
      return res.status(400).json({ message: 'That invoice number already exists.' });
    }
    console.error('Create invoice error:', err);
    res.status(500).json({ message: 'Could not create invoice.' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  const { BookingId, InvoiceNumber, InvoiceDate, Amount, PaymentStatus } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('bookingId', sql.Int, BookingId)
      .input('invoiceNumber', sql.NVarChar, InvoiceNumber)
      .input('invoiceDate', sql.Date, InvoiceDate)
      .input('amount', sql.Decimal(12, 2), Amount)
      .input('paymentStatus', sql.NVarChar, PaymentStatus)
      .query(`UPDATE Invoices
              SET BookingId = @bookingId,
                  InvoiceNumber = @invoiceNumber,
                  InvoiceDate = @invoiceDate,
                  Amount = @amount,
                  PaymentStatus = @paymentStatus
              OUTPUT INSERTED.*
              WHERE InvoiceId = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ message: 'Could not update invoice.' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Invoices OUTPUT DELETED.* WHERE InvoiceId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }
    res.json({ message: 'Invoice deleted successfully.' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ message: 'Could not delete invoice.' });
  }
});

module.exports = router;
