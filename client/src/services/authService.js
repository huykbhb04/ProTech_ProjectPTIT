import api from './api';

const authService = {
    sendRegisterOtp: async (email) => {
        const response = await api.post('/auth/register/otp', { email });
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },
    getGoogleAuthUrl: async () => {
        const response = await api.get('/auth/google');
        return response.data.url;
    },
    googleCallback: async (code) => {
        const response = await api.post('/auth/google/callback', { code });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },
    exchangeGoogleCode: async (code) => {
        const response = await api.post('/auth/google/callback', { code });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('user');
    },
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    }
};

export default authService;
