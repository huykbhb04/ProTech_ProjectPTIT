import api from './api';

const API_PATH = '/listings';

const listingService = {
    createListing: async (listingData) => {
        const response = await api.post(API_PATH, listingData);
        return response.data;
    },

    getActiveListings: async () => {
        const response = await api.get(`${API_PATH}/active`);
        return response.data;
    },

    getLandlordListings: async () => {
        const response = await api.get(`${API_PATH}/landlord`);
        return response.data;
    },

    updateListing: async (id, updateData) => {
        const response = await api.put(`${API_PATH}/${id}`, updateData);
        return response.data;
    },

    deleteListing: async (id) => {
        const response = await api.delete(`${API_PATH}/${id}`);
        return response.data;
    },

    getListingByRoom: async (roomId) => {
        const response = await api.get(`${API_PATH}/room/${roomId}`);
        return response.data;
    }
};

export default listingService;
