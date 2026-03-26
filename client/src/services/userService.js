import api from './api';

const userService = {
    getProfile: async () => {
        const response = await api.get('/users/me');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/users/profile', data);
        return response.data;
    },

    uploadAvatar: async (formData) => {
        const response = await api.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getPaymentMethods: async () => {
        const response = await api.get('/users/payment-methods');
        return response.data;
    },

    addPaymentMethod: async (data) => {
        const response = await api.post('/users/payment-methods', data);
        return response.data;
    },

    deletePaymentMethod: async (id) => {
        const response = await api.delete(`/users/payment-methods/${id}`);
        return response.data;
    },

    verifyIdentity: async (identityData) => {
        const response = await api.post('/users/verify-id', { identityData });
        return response.data;
    }
};

export default userService;
