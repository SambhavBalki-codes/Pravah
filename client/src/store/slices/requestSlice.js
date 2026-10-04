import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

export const getSupervisorRequests = createAsyncThunk(
  "request/getSupervisorRequests",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/teacher/requests");
      return response.data.data.requests;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load supervisor requests.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const respondToSupervisorRequest = createAsyncThunk(
  "request/respondToSupervisorRequest",
  async ({ requestId, decision }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/teacher/requests/${requestId}/${decision}`);
      appToast.success(response.data.message);
      return requestId;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to respond to supervisor request.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const requestSlice = createSlice({
  name: "request",
  initialState: { list: [], selected: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSupervisorRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupervisorRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getSupervisorRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(respondToSupervisorRequest.fulfilled, (state, action) => {
        state.list = state.list.filter((request) => request._id !== action.payload);
      });
  },
});

export default requestSlice.reducer;
