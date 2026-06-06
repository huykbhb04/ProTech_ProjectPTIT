import axios from 'axios';

const API_URL = '/api/monetization';

const monetizationService = {
    getPackages: async (token) => {
        const response = await axios.get(`${API_URL}/packages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getPremiumServices: async (token) => {
        const response = await axios.get(`${API_URL}/premium-services`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getWalletInfo: async (token) => {
        const response = await axios.get(`${API_URL}/wallet`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getWalletHistoryPaginated: async (token, page = 1, limit = 10) => {
        const response = await axios.get(`${API_URL}/wallet/paginated`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page, limit }
        });
        return response.data;
    },

    topUpWallet: async (token, payload) => {
        const response = await axios.post(`${API_URL}/wallet/topup`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },
    getWalletTopup: async (token, topupId) => {
        const response = await axios.get(`/api/wallet-topups/topup/${topupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },
    pollWalletTopups: async (token) => {
        const response = await axios.post(`/api/wallet-topups/topup/poll`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getRenewalQuote: async (token, listingId, durationDays = 30) => {
        const response = await axios.get(`${API_URL}/listing-renewal-quote/${listingId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { durationDays }
        });
        return response.data;
    },

    processPayment: async (paymentData, token) => {
        const response = await axios.post(`${API_URL}/pay`, paymentData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default monetizationService;
