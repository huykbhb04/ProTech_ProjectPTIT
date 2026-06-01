const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; // { userId, user_id, role, ... }

        // Normalize IDs to ensure consistency
        if (!req.user.user_id && req.user.userId) req.user.user_id = req.user.userId;
        if (!req.user.userId && req.user.user_id) req.user.userId = req.user.user_id;

        next();
    } catch (error) {
        console.error('[JWT Verification Error]:', error.message, 'Token:', token);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const landlordOnly = (req, res, next) => {
    if (req.user && req.user.role === 'landlord') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Landlord only' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
};

module.exports = {
    protect,
    landlordOnly,
    adminOnly
};
