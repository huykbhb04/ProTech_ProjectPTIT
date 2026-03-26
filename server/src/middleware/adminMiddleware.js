const { protect } = require('./authMiddleware');

const adminOnly = (req, res, next) => {
    // First verify authentication
    protect(req, res, () => {
        // Then check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        next();
    });
};

module.exports = adminOnly;
