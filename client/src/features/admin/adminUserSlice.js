import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
    users: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Get all users
export const getAllUsers = createAsyncThunk('adminUsers/getAll', async (filters, thunkAPI) => {
    try {
        const response = await api.get('/admin/users', { params: filters });
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create user
export const createUser = createAsyncThunk('adminUsers/create', async (userData, thunkAPI) => {
    try {
        const response = await api.post('/admin/users', userData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update user
export const updateUser = createAsyncThunk('adminUsers/update', async ({ id, userData }, thunkAPI) => {
    try {
        const response = await api.put(`/admin/users/${id}`, userData);
        return response.data;
    } catch (error) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update status
export const updateUserStatus = createAsyncThunk('adminUsers/updateStatus', async ({ id, status }, thunkAPI) => {
    try {
        const response = await api.patch(`/admin/users/${id}/status`, { status });
        return { id, status, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete user
export const deleteUser = createAsyncThunk('adminUsers/delete', async (id, thunkAPI) => {
    try {
        const response = await api.delete(`/admin/users/${id}`);
        return { id, message: response.data.message };
    } catch (error) {
        const message = error.response?.data?.message || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const adminUserSlice = createSlice({
    name: 'adminUsers',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getAllUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.users = action.payload;
            })
            .addCase(getAllUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createUser.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = true;
            })
            .addCase(createUser.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                const user = state.users.find(u => u.user_id === action.payload.id);
                if (user) user.status = action.payload.status;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u.user_id !== action.payload.id);
            });
    },
});

export const { reset } = adminUserSlice.actions;
export default adminUserSlice.reducer;
