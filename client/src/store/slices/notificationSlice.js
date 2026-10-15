import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const failure = (error, fallback) => error.response?.data?.message || fallback;

export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async ({ page = 1, type = "all", status = "all" } = {}, thunkAPI) => {
    try {
      const params = { page, limit: 10 };
      if (type !== "all") params.type = type;
      if (status !== "all") params.status = status;
      const response = await axiosInstance.get("/notifications", { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to load notifications."));
    }
  },
);

// Used by the navbar badge, so it fails silently
export const fetchUnreadCount = createAsyncThunk(
  "notification/fetchUnreadCount",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/notifications/unread-count");
      return response.data.data.count;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to load unread count."));
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  "notification/markNotificationRead",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      return id;
    } catch (error) {
      const message = failure(error, "Failed to mark as read.");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  "notification/markAllNotificationsRead",
  async (_, thunkAPI) => {
    try {
      await axiosInstance.put("/notifications/read-all");
      return true;
    } catch (error) {
      const message = failure(error, "Failed to mark all as read.");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      const message = failure(error, "Failed to delete the notification.");
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const emptySummary = { total: 0, unread: 0, read: 0, highPriority: 0, thisWeek: 0 };

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    list: [],
    pagination: { page: 1, totalPages: 1, total: 0, hasNextPage: false, hasPreviousPage: false },
    summary: emptySummary,
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.notifications || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.summary = action.payload.summary || emptySummary;
        state.unreadCount = state.summary.unread;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.list.find((n) => n._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.summary.unread = Math.max(0, state.summary.unread - 1);
          state.summary.read += 1;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.list.forEach((n) => {
          n.isRead = true;
        });
        state.summary.unread = 0;
        state.summary.read = state.summary.total;
        state.unreadCount = 0;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const item = state.list.find((n) => n._id === action.payload);
        state.list = state.list.filter((n) => n._id !== action.payload);
        if (item) {
          state.summary.total = Math.max(0, state.summary.total - 1);
          if (item.isRead) {
            state.summary.read = Math.max(0, state.summary.read - 1);
          } else {
            state.summary.unread = Math.max(0, state.summary.unread - 1);
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          if (item.priority === "high") {
            state.summary.highPriority = Math.max(0, state.summary.highPriority - 1);
          }
        }
      });
  },
});

export default notificationSlice.reducer;