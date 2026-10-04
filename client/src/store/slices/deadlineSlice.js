import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

const handleError = (error, fallback, thunkAPI) => {
  const message = error.response?.data?.message || fallback;
  appToast.error(message);
  return thunkAPI.rejectWithValue(message);
};

export const getDeadlines = createAsyncThunk(
  "deadline/getDeadlines",
  async (filter = "all", thunkAPI) => {
    try {
      const response = await axiosInstance.get("/admin/deadlines", {
        params: { filter },
      });
      return response.data.data.deadlines;
    } catch (error) {
      return handleError(error, "Failed to load deadlines.", thunkAPI);
    }
  },
);

export const createDeadline = createAsyncThunk(
  "deadline/createDeadline",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/admin/deadlines", data);
      appToast.success(response.data.message);
      return response.data.data.deadline;
    } catch (error) {
      return handleError(error, "Failed to create deadline.", thunkAPI);
    }
  },
);

export const updateDeadline = createAsyncThunk(
  "deadline/updateDeadline",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/admin/deadlines/${id}`, data);
      appToast.success(response.data.message);
      return response.data.data.deadline;
    } catch (error) {
      return handleError(error, "Failed to update deadline.", thunkAPI);
    }
  },
);

export const toggleDeadline = createAsyncThunk(
  "deadline/toggleDeadline",
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/admin/deadlines/${id}/toggle`);
      appToast.success(response.data.message);
      return response.data.data.deadline;
    } catch (error) {
      return handleError(error, "Failed to update deadline status.", thunkAPI);
    }
  },
);

export const deleteDeadline = createAsyncThunk(
  "deadline/deleteDeadline",
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.delete(`/admin/deadlines/${id}`);
      appToast.success(response.data.message);
      return id;
    } catch (error) {
      return handleError(error, "Failed to delete deadline.", thunkAPI);
    }
  },
);

const deadlineSlice = createSlice({
  name: "deadline",
  initialState: {
    deadlines: [],
    nearby: [],
    selected: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDeadlines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDeadlines.fulfilled, (state, action) => {
        state.loading = false;
        state.deadlines = action.payload;
      })
      .addCase(getDeadlines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDeadline.fulfilled, (state, action) => {
        state.deadlines.push(action.payload);
        state.deadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      })
      .addCase(updateDeadline.fulfilled, (state, action) => {
        state.deadlines = state.deadlines.map((deadline) =>
          deadline._id === action.payload._id ? { ...deadline, ...action.payload } : deadline,
        );
      })
      .addCase(toggleDeadline.fulfilled, (state, action) => {
        state.deadlines = state.deadlines.map((deadline) =>
          deadline._id === action.payload._id ? { ...deadline, ...action.payload } : deadline,
        );
      })
      .addCase(deleteDeadline.fulfilled, (state, action) => {
        state.deadlines = state.deadlines.filter((deadline) => deadline._id !== action.payload);
      });
  },
});

export default deadlineSlice.reducer;
