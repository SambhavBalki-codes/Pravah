import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

export const getTeacherDashboard = createAsyncThunk(
  "teacher/getTeacherDashboard",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/teacher/dashboard");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load teacher dashboard.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTeacherDashboard.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(getTeacherDashboard.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(getTeacherDashboard.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      });
  },
});

export default teacherSlice.reducer;
