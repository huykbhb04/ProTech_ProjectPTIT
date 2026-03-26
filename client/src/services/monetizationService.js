import axios from 'axios';

const API_URL = '/api/monetization';

const monetizationService = {
    // Get all available packages
    getPackages: async (token) => {
        const response = await axios.get(`${API_URL}/packages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get all premium services
    getPremiumServices: async (token) => {
        const response = await axios.get(`${API_URL}/premium-services`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get wallet info (balance + history)
    getWalletInfo: async (token) => {
        const response = await axios.get(`${API_URL}/wallet`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Process a payment (simulated)
    processPayment: async (paymentData, token) => {
        const response = await axios.post(`${API_URL}/pay`, paymentData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default monetizationService;
