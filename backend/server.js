// This is the entry point of the backend.
// Running "npm start" (or "node server.js") starts this file.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const invoiceRoutes = require('./routes/invoices');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors());          // allows the Angular app (different port) to call this API
app.use(express.json());  // lets us read JSON bodies from requests (req.body)

// Every route file below is mounted under its own path.
// e.g. auth.js's "/login" becomes "/api/auth/login"
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// A simple health check - open http://localhost:5000/ in a browser
// to confirm the server is alive.
app.get('/', (req, res) => {
  res.send('MediaLedger API is running.');
});

// Catch-all for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MediaLedger backend running on http://localhost:${PORT}`);
});
