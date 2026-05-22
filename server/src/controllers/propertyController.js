const Property = require('../models/propertyModel');

// --- Building Controllers ---
exports.createBuilding = async (req, res) => {
    try {
        const { name, address, type, description, totalFloors, coordinates } = req.body;
        const landlordId = req.user.userId; // From JWT middleware

        const buildingId = await Property.createBuilding({
            landlordId,
            name,
            address,
            type,
            description,
            totalFloors,
            coordinates
        });

        const newBuilding = await Property.getBuildingById(buildingId);

        res.status(201).json(newBuilding);
    } catch (error) {
        console.error("Create Building Error:", error);
        res.status(500).json({ message: 'Error creating building', error: error.message });
    }
};

exports.getMyBuildings = async (req, res) => {
    try {
        const landlordId = req.user.userId;
        const buildings = await Property.getBuildingsByLandlord(landlordId);
        res.json(buildings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching buildings' });
    }
};

exports.getBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await Property.getBuildingById(id);
        if (!building) {
            return res.status(404).json({ message: 'Building not found' });
        }
        const stats = await Property.getBuildingStatistics(id);
        const rooms = await Property.getRoomsByBuilding(id);
        res.json({ ...building, statistics: stats, rooms });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching building details' });
    }
};

// --- Room Controllers ---
exports.createRoom = async (req, res) => {
    try {
        const { buildingId, roomNumber, floor, area, basePrice, electricityPrice, waterPrice, servicePrice, description, amenities, images } = req.body;

        // Verify ownership (optional but recommended)
        // const building = await Property.getBuildingById(buildingId);
        // if (building.landlord_id !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });

        const roomId = await Property.createRoom({
            buildingId,
            roomNumber,
            floor,
            area,
            basePrice,
            electricityPrice,
            waterPrice,
            servicePrice,
            description,
            amenities,
            images
        });

        res.status(201).json({ message: 'Room created successfully', roomId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating room' });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const rooms = await Property.getRoomsByBuilding(buildingId);
        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching rooms' });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const updates = req.body;
        await Property.updateRoom(roomId, updates);
        res.json({ message: 'Room updated successfully', roomId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating room' });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { roomId } = req.params;

        // 1. Check if room exists and its status
        const room = await Property.getRoomDetails(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.status === 'occupied') {
            return res.status(400).json({ message: 'Cannot delete an occupied room' });
        }

        await Property.deleteRoom(roomId);
        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting room' });
    }
};

exports.getRoomDetails = async (req, res) => {
    try {
        const { roomId } = req.params;
        const details = await Property.getRoomDetails(roomId);
        if (!details) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(details);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching room details' });
    }
};

exports.getAvailableRoomsAll = async (req, res) => {
    try {
        const landlordId = req.user.userId;
        const rooms = await Property.getAvailableRoomsByLandlord(landlordId);
        res.json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching available rooms' });
    }
};
