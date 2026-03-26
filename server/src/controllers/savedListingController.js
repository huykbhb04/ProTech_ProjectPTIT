const SavedListing = require('../models/savedListingModel');

exports.toggleSave = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { listingId } = req.body;

        if (!listingId) {
            return res.status(400).json({ message: 'Listing ID is required' });
        }

        const result = await SavedListing.toggle(userId, listingId);
        res.json({
            message: result.saved ? 'Đã lưu vào danh sách yêu thích' : 'Đã xóa khỏi danh sách yêu thích',
            isSaved: result.saved
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSavedListings = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const listings = await SavedListing.getByUserId(userId);
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSavedIds = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const ids = await SavedListing.getSavedIds(userId);
        res.json(ids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
