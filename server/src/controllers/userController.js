const User = require('../models/userModel');
const cloudinary = require('../config/cloudinary');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Don't send password hash
        delete user.password_hash;
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const data = req.body;

        // Validation for email duplicate could be added here if email is changed

        const success = await User.updateProfile(userId, data);
        if (success) {
            const updatedUser = await User.findById(userId);
            delete updatedUser.password_hash;
            res.json({ message: 'Profile updated successfully', user: updatedUser });
        } else {
            res.status(400).json({ message: 'No changes made or update failed' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        const userId = req.user.user_id;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const avatarUrl = req.file.path; // Cloudinary URL
        await User.updateProfile(userId, { avatar_url: avatarUrl });

        res.json({ message: 'Avatar uploaded successfully', avatarUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPaymentMethods = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const methods = await User.getPaymentMethods(userId);
        res.json(methods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addPaymentMethod = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const data = req.body;
        const methodId = await User.addPaymentMethod(userId, data);
        res.status(201).json({ message: 'Payment method added', methodId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePaymentMethod = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { id } = req.params;
        const success = await User.deletePaymentMethod(userId, id);
        if (success) res.json({ message: 'Payment method deleted' });
        else res.status(404).json({ message: 'Payment method not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyIdentity = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { identityData } = req.body;

        // Here we would call AI service for confirmation or trust the frontend's AI extraction if already verified
        // For now, let's mark as verified if data is provided.
        await User.updateProfile(userId, {
            identity_card_number: identityData.idNumber,
            full_name: identityData.fullName,
            is_verified: true,
            reputation_score: 110 // Bonus for verification
        });

        res.json({ message: 'Identity verified successfully', is_verified: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
