const Listing = require('../models/listingModel');
const db = require('../config/database');

exports.createListing = async (req, res) => {
    try {
        const { room_id, title, description } = req.body;

        // 1. Check if the room already has an active listing
        const [activeRoomListings] = await db.query(
            "SELECT * FROM room_listings WHERE room_id = ? AND status = 'active'",
            [room_id]
        );
        if (activeRoomListings.length > 0) {
            return res.status(400).json({
                message: 'Phòng trọ này đã có tin đăng đang hoạt động! Bạn không thể đăng tin trùng lặp. Vui lòng cập nhật hoặc tắt tin đăng cũ.'
            });
        }

        // 2. Check if the landlord already has a listing with highly similar content
        const [roomRows] = await db.query(
            "SELECT building_id FROM rooms WHERE room_id = ?",
            [room_id]
        );
        if (roomRows.length > 0) {
            const buildingId = roomRows[0].building_id;
            const [buildingRows] = await db.query(
                "SELECT landlord_id FROM buildings WHERE building_id = ?",
                [buildingId]
            );
            if (buildingRows.length > 0) {
                const landlordId = buildingRows[0].landlord_id;

                // Check reputation score restriction
                const [landlordUser] = await db.query(
                    "SELECT reputation_score FROM users WHERE user_id = ?",
                    [landlordId]
                );
                if (landlordUser[0] && landlordUser[0].reputation_score < 50) {
                    return res.status(403).json({
                        message: 'Tài khoản của bạn bị hạn chế đăng tin mới do điểm uy tín quá thấp (dưới 50). Vui lòng liên hệ Admin để cải thiện.'
                    });
                }

                // Check for similar active listings from this landlord
                const [landlordListings] = await db.query(`
                    SELECT rl.title, rl.description 
                    FROM room_listings rl
                    JOIN rooms r ON rl.room_id = r.room_id
                    JOIN buildings b ON r.building_id = b.building_id
                    WHERE b.landlord_id = ? AND rl.status = 'active'
                `, [landlordId]);

                const newTitle = (title || '').trim().toLowerCase();

                for (const item of landlordListings) {
                    const existingTitle = (item.title || '').trim().toLowerCase();

                    // If title is identical or highly overlapping, reject as duplicate
                    if (existingTitle === newTitle || (newTitle.includes(existingTitle) && newTitle.length - existingTitle.length < 10) || (existingTitle.includes(newTitle) && existingTitle.length - newTitle.length < 10)) {
                        return res.status(400).json({
                            message: 'Hệ thống phát hiện bạn đang đăng lại tin trọ trùng lặp nội dung với một tin đăng khác đang hoạt động. Vui lòng chỉnh sửa tin cũ hoặc đổi tiêu đề mới.'
                        });
                    }
                }
            }
        }

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
