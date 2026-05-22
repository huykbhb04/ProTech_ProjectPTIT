import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import propertyReducer from './features/properties/propertySlice';
import savedListingsReducer from './features/savedListings/savedListingsSlice';
import adminUserReducer from './features/admin/adminUserSlice';

const loadAuthState = () => {
    try {
        const stored = localStorage.getItem('user');
        if (!stored) return undefined;
        const parsed = JSON.parse(stored);
        return {
            auth: {
                user: parsed?.user || null,
                token: parsed?.token || null,
                isError: false,
                isSuccess: false,
                isLoading: false,
                message: '',
            },
        };
    } catch {
        return undefined;
    }
};

export const store = configureStore({
    reducer: {
        auth: authReducer,
        properties: propertyReducer,
        savedListings: savedListingsReducer,
        adminUsers: adminUserReducer,
    },
    preloadedState: loadAuthState(),
});
