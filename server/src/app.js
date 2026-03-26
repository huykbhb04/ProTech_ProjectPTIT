const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/tenant', require('./routes/tenantRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/monetization', require('./routes/monetizationRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); // Register AI Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/saved-listings', require('./routes/savedListingRoutes'));
app.use('/api/roommates', require('./routes/roommateRoutes'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Smart PropTech API' });
});

module.exports = app;

// Initialize Cron Jobs
const CronJobs = require('./services/cronJobs');
CronJobs.init();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
