import api from './api';

const savedListingService = {
    toggleSave: async (listingId) => {
        const response = await api.post('/saved-listings/toggle', { listingId });
        return response.data;
    },

    getSavedListings: async () => {
        const response = await api.get('/saved-listings');
        return response.data;
    },

    getSavedIds: async () => {
        const response = await api.get('/saved-listings/ids');
        return response.data;
    }
};

export default savedListingService;
