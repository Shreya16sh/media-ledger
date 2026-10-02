const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const requireAuth = require('../middleware/auth');

// Every route below runs requireAuth first - no token, no access.
router.use(requireAuth);

// GET /api/bookings?search=lush
// Returns all bookings, or filters by client/campaign/channel if "search" is given.
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    let query = 'SELECT * FROM Bookings';
    if (search) {
      query += ` WHERE ClientName LIKE @search
                 OR Campaign LIKE @search
                 OR MediaChannel LIKE @search`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    query += ' ORDER BY BookingDate DESC';

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Could not fetch bookings.' });
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Bookings WHERE BookingId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ message: 'Could not fetch booking.' });
  }
});

// POST /api/bookings
// Body: { clientName, mediaChannel, campaign, bookingDate, amount, status }
router.post('/', async (req, res) => {
  const { ClientName, MediaChannel, Campaign, BookingDate, Amount, Status } = req.body;

  if (!ClientName || !MediaChannel || !Campaign || !BookingDate || Amount === undefined || Amount === null) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('clientName', sql.NVarChar, ClientName)
      .input('mediaChannel', sql.NVarChar, MediaChannel)
      .input('campaign', sql.NVarChar, Campaign)
      .input('bookingDate', sql.Date, BookingDate)
      .input('amount', sql.Decimal(12, 2), Amount)
      .input('status', sql.NVarChar, Status || 'Pending')
      .query(`INSERT INTO Bookings (ClientName, MediaChannel, Campaign, BookingDate, Amount, Status)
              OUTPUT INSERTED.*
              VALUES (@clientName, @mediaChannel, @campaign, @bookingDate, @amount, @status)`);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Could not create booking.' });
  }
});

// PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  const { ClientName, MediaChannel, Campaign, BookingDate, Amount, Status } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('clientName', sql.NVarChar, ClientName)
      .input('mediaChannel', sql.NVarChar, MediaChannel)
      .input('campaign', sql.NVarChar, Campaign)
      .input('bookingDate', sql.Date, BookingDate)
      .input('amount', sql.Decimal(12, 2), Amount)
      .input('status', sql.NVarChar, Status)
      .query(`UPDATE Bookings
              SET ClientName = @clientName,
                  MediaChannel = @mediaChannel,
                  Campaign = @campaign,
                  BookingDate = @bookingDate,
                  Amount = @amount,
                  Status = @status
              OUTPUT INSERTED.*
              WHERE BookingId = @id`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ message: 'Could not update booking.' });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Bookings with invoices attached can't be deleted (foreign key) -
    // check first so we can give a friendly message instead of a DB crash.
    const invoiceCheck = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT COUNT(*) AS count FROM Invoices WHERE BookingId = @id');

    if (invoiceCheck.recordset[0].count > 0) {
      return res.status(400).json({
        message: 'This booking has invoices linked to it. Delete those invoices first.'
      });
    }

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Bookings OUTPUT DELETED.* WHERE BookingId = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json({ message: 'Booking deleted successfully.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ message: 'Could not delete booking.' });
  }
});

module.exports = router;
