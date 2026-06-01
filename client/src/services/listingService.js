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

    getLandlordListingsPaginated: async (params) => {
        const response = await api.get(`${API_PATH}/landlord/paginated`, { params });
        return response.data;
    },

    updateListing: async (id, updateData) => {
        const response = await api.put(`${API_PATH}/${id}`, updateData);
        return response.data;
    },

    renewListing: async (id, renewData) => {
        const response = await api.put(`${API_PATH}/${id}`, renewData);
        return response.data;
    },

    deleteListing: async (id) => {
        const response = await api.delete(`${API_PATH}/${id}`);
        return response.data;
    },

    getListingByRoom: async (roomId) => {
        const response = await api.get(`${API_PATH}/room/${roomId}`);
        return response.data;
    },

    getActiveBanners: async () => {
        // Correct path moved from admin/system to listings/banners/active
        const response = await api.get(`${API_PATH}/banners/active`);
        return response.data;
    },

    getPublicSystemConfigs: async () => {
        const response = await api.get(`${API_PATH}/configs`);
        return response.data;
    },

    getPublicTheme: async () => {
        const response = await api.get(`${API_PATH}/theme`);
        return response.data;
    },

    incrementView: async (listingId) => {
        const response = await api.post(`${API_PATH}/${listingId}/view`);
        return response.data;
    },

    reportListing: async (listingId, reportData) => {
        const response = await api.post(`/reports/listings/${listingId}/report`, reportData);
        return response.data;
    }
};

export default listingService;
