import api from './api';

const propertyService = {
    // Building APIs
    createBuilding: async (buildingData) => {
        const response = await api.post('/properties/buildings', buildingData);
        return response.data;
    },
    getMyBuildings: async () => {
        const response = await api.get('/properties/buildings');
        return response.data;
    },
    getBuilding: async (id) => {
        const response = await api.get(`/properties/buildings/${id}`);
        return response.data;
    },

    // Room APIs
    createRoom: async (roomData) => {
        const response = await api.post('/properties/rooms', roomData);
        return response.data;
    },
    getRoomsByBuilding: async (buildingId) => {
        const response = await api.get(`/properties/buildings/${buildingId}/rooms`);
        return response.data;
    },
    updateRoom: async (roomId, roomData) => {
        const response = await api.put(`/properties/rooms/${roomId}`, roomData);
        return response.data;
    },
    deleteRoom: async (roomId) => {
        const response = await api.delete(`/properties/rooms/${roomId}`);
        return response.data;
    },
    getRoomDetails: async (roomId) => {
        const response = await api.get(`/properties/rooms/${roomId}/details`);
        return response.data;
    },
    getAvailableRoomsAll: async () => {
        const response = await api.get('/properties/rooms/available-all');
        return response.data;
    },
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    verifyAmenity: async (amenityType, file) => {
        const formData = new FormData();
        formData.append('amenity_type', amenityType);
        formData.append('file', file);
        // Note: Calling AI service directly on port 8000
        const response = await fetch('http://localhost:8000/verify-amenity', {
            method: 'POST',
            body: formData
        });
        return response.json();
    }
};

export default propertyService;
