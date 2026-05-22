const Listing = require('../models/listingModel');

exports.createListing = async (req, res) => {
    try {
        const listingId = await Listing.create(req.body);
        res.status(201).json({ message: 'Listing created successfully', listingId });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ message: 'Server error creating listing', error: error.message });
    }
};

exports.getActiveListings = async (req, res) => {
    try {
        const listings = await Listing.getAllActive();
        res.json(listings);
    } catch (error) {
        console.error('Error fetching active listings:', error);
        res.status(500).json({ message: 'Server error fetching listings', error: error.message });
    }
};

exports.getLandlordListings = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.userId;
        const listings = await Listing.getByLandlord(userId);
        res.json(listings);
    } catch (error) {
        console.error('Error fetching landlord listings:', error);
        res.status(500).json({ message: 'Server error fetching landlord listings', error: error.message });
    }
};

exports.getLandlordListingsPaginated = async (req, res) => {
    try {
        const { page = 1, limit = 10, status = '', search = '' } = req.query;
        const result = await Listing.getByLandlordPaginated(req.user.userId, {
            page: parseInt(page),
            limit: Math.min(50, parseInt(limit)),
            status,
            search
        });
        res.json(result);
    } catch (error) {
        console.error('Error fetching paginated landlord listings:', error);
        res.status(500).json({ message: 'Lỗi tải danh sách tin đăng', error: error.message });
    }
};

exports.updateListing = async (req, res) => {
    try {
        await Listing.update(req.params.id, req.body);
        res.json({ message: 'Listing updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating listing' });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        await Listing.delete(req.params.id);
        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting listing' });
    }
};

exports.getListingByRoom = async (req, res) => {
    try {
        const listing = await Listing.getByRoomId(req.params.roomId);
        res.json(listing);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching listing' });
    }
};

exports.incrementView = async (req, res) => {
    try {
        await Listing.incrementView(req.params.id);
        res.json({ message: 'View incremented' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error incrementing view' });
    }
};
