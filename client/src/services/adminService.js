import axios from 'axios';

const API_URL = '/api/admin';

const adminService = {
    // ===== LISTING PACKAGES =====
    getAllPackages: async (token) => {
        const response = await axios.get(`${API_URL}/packages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createPackage: async (data, token) => {
        const response = await axios.post(`${API_URL}/packages`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updatePackage: async (packageId, data, token) => {
        const response = await axios.put(`${API_URL}/packages/${packageId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    togglePackageStatus: async (packageId, token) => {
        const response = await axios.patch(`${API_URL}/packages/${packageId}/toggle`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deletePackage: async (packageId, token) => {
        const response = await axios.delete(`${API_URL}/packages/${packageId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // ===== PREMIUM SERVICES =====
    getAllPremiumServices: async (token) => {
        const response = await axios.get(`${API_URL}/services`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createPremiumService: async (data, token) => {
        const response = await axios.post(`${API_URL}/services`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    updatePremiumService: async (serviceId, data, token) => {
        const response = await axios.put(`${API_URL}/services/${serviceId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    toggleServiceStatus: async (serviceId, token) => {
        const response = await axios.patch(`${API_URL}/services/${serviceId}/toggle`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deleteService: async (serviceId, token) => {
        const response = await axios.delete(`${API_URL}/services/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default adminService;
