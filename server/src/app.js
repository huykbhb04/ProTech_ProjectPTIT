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

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[RESPONSE] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    if (req.headers.authorization) {
        console.log('  Authorization:', req.headers.authorization.substring(0, 30) + '...');
    } else {
        console.log('  Authorization: NONE');
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/tenant', require('./routes/tenantRoutes'));
app.use('/api/listings', require('./routes/listingRoutes'));
app.use('/api/monetization', require('./routes/monetizationRoutes'));
app.use('/api/wallet-topups', require('./routes/walletTopupRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); // Register AI Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/contracts', require('./routes/contractRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/saved-listings', require('./routes/savedListingRoutes'));
app.use('/api/roommates', require('./routes/roommateRoutes'));
app.use('/api/admin/system', require('./routes/adminConfigRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/landlord/banners', require('./routes/bannerRoutes'));
app.use('/api/landlord/stats', require('./routes/statisticsRoutes'));
app.use('/api/admin/stats', require('./routes/adminStatisticsRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

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
