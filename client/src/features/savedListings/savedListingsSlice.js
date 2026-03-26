import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import savedListingService from '../../services/savedListingService';

export const fetchSavedIds = createAsyncThunk(
    'savedListings/fetchIds',
    async (_, thunkAPI) => {
        try {
            return await savedListingService.getSavedIds();
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

export const toggleSaveListing = createAsyncThunk(
    'savedListings/toggle',
    async (listingId, thunkAPI) => {
        try {
            const response = await savedListingService.toggleSave(listingId);
            return { listingId, isSaved: response.isSaved };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

const savedListingsSlice = createSlice({
    name: 'savedListings',
    initialState: {
        savedIds: [],
        isLoading: false,
        isError: false,
        message: ''
    },
    reducers: {
        resetSavedListings: (state) => {
            state.savedIds = [];
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSavedIds.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchSavedIds.fulfilled, (state, action) => {
                state.isLoading = false;
                state.savedIds = action.payload;
            })
            .addCase(fetchSavedIds.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(toggleSaveListing.fulfilled, (state, action) => {
                const { listingId, isSaved } = action.payload;
                if (isSaved) {
                    if (!state.savedIds.includes(listingId)) {
                        state.savedIds.push(listingId);
                    }
                } else {
                    state.savedIds = state.savedIds.filter(id => id !== listingId);
                }
            })
            .addCase('auth/logout/fulfilled', (state) => {
                state.savedIds = [];
            })
            .addCase('auth/login/fulfilled', (state) => {
                state.savedIds = []; // Clear old user's data while waiting for fetch
            });
    }
});

export const { resetSavedListings } = savedListingsSlice.actions;
export default savedListingsSlice.reducer;
