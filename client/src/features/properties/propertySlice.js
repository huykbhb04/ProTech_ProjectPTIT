import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import propertyService from '../../services/propertyService';

const initialState = {
    buildings: [],
    currentBuilding: null, // For detail view
    rooms: [], // Rooms of currentBuilding
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Fetch user's buildings
export const getMyBuildings = createAsyncThunk(
    'properties/getMyBuildings',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await propertyService.getMyBuildings(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get single building details
export const getBuilding = createAsyncThunk(
    'properties/getBuilding',
    async (id, thunkAPI) => {
        try {
            return await propertyService.getBuilding(id);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create new building
export const createBuilding = createAsyncThunk(
    'properties/createBuilding',
    async (buildingData, thunkAPI) => {
        try {
            return await propertyService.createBuilding(buildingData);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get Rooms by Building
export const getRooms = createAsyncThunk(
    'properties/getRooms',
    async (buildingId, thunkAPI) => {
        try {
            return await propertyService.getRoomsByBuilding(buildingId);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create Room
export const createRoom = createAsyncThunk(
    'properties/createRoom',
    async (roomData, thunkAPI) => {
        try {
            return await propertyService.createRoom(roomData);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update Room
export const updateRoom = createAsyncThunk(
    'properties/updateRoom',
    async ({ roomId, roomData }, thunkAPI) => {
        try {
            return await propertyService.updateRoom(roomId, roomData);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Delete Room
export const deleteRoom = createAsyncThunk(
    'properties/deleteRoom',
    async (roomId, thunkAPI) => {
        try {
            return await propertyService.deleteRoom(roomId);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);
export const getRoomDetails = createAsyncThunk(
    'properties/getRoomDetails',
    async (roomId, thunkAPI) => {
        try {
            return await propertyService.getRoomDetails(roomId);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const propertySlice = createSlice({
    name: 'properties',
    initialState: {
        ...initialState,
        currentRoomDetails: null // For storing detailed info
    },
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            // Do not reset buildings/currentBuilding unless explicit
        },
        resetCurrent: (state) => {
            state.currentBuilding = null;
            state.rooms = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyBuildings.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMyBuildings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.buildings = action.payload;
            })
            .addCase(getMyBuildings.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createBuilding.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.buildings.push(action.payload);
            })
            .addCase(getBuilding.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getBuilding.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.currentBuilding = action.payload;
            })
            .addCase(getRooms.fulfilled, (state, action) => {
                state.isLoading = false;
                state.rooms = action.payload;
            })
            .addCase(createRoom.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // In a real app we might want to push to state.rooms, but reloading is safer for now or we return full room object
            })
            .addCase(getRoomDetails.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getRoomDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentRoomDetails = action.payload;
            })
            .addCase(deleteRoom.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // We'll handle filtering from the UI or calling getRooms again
            });
    },
});

export const { reset, resetCurrent } = propertySlice.actions;
export default propertySlice.reducer;
