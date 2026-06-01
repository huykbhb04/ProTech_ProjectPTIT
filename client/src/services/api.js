import axios from 'axios';

const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const { hostname, port } = window.location;
        // If we are on Vite dev server (usually ports 5173-5179), use Vite proxy
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && Number(port) >= 5173 && Number(port) <= 5179) {
            return '/api';
        }
        // If we are on another local port (e.g. 5500 Live Server), go directly to backend
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://127.0.0.1:3000/api';
        }
    }
    return '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.token) {
                    config.headers['Authorization'] = `Bearer ${user.token}`;
                }
            }
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized request! Clearing user storage and redirecting to login...');
            localStorage.removeItem('user');
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
