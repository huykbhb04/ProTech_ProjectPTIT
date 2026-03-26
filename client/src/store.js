import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import propertyReducer from './features/properties/propertySlice';
import savedListingsReducer from './features/savedListings/savedListingsSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        properties: propertyReducer,
        savedListings: savedListingsReducer,
    },
});
