import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

export const createStudent = createAsyncThunk(
  "admin/createStudent",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-student", data);
      appToast.success(res.data.message || "Student created successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to create student. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateStudent = createAsyncThunk(
  "admin/updateStudent",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-student/${id}`, data);
      appToast.success(res.data.message || "Student updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update student. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteStudent = createAsyncThunk(
  "admin/deleteStudent",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-student/${id}`);
      appToast.success(res.data.message || "Student deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to delete student. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const createTeacher = createAsyncThunk(
  "admin/createTeacher",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-teacher", data);
      appToast.success(res.data.message || "Teacher created successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to create teacher. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateTeacher = createAsyncThunk(
  "admin/updateTeacher",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-teacher/${id}`, data);
      appToast.success(res.data.message || "Teacher updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update teacher. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteTeacher = createAsyncThunk(
  "admin/deleteTeacher",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-teacher/${id}`);
      appToast.success(res.data.message || "Teacher deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to delete teacher. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getAllUsers = createAsyncThunk(
  "admin/getAllUsers",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/admin/users");
      return res.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load users. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getAllProjects = createAsyncThunk(
  "admin/getAllProjects",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/admin/projects");
      return res.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load projects. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getDashboardStats = createAsyncThunk(
  "admin/getDashboardStats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/admin/dashboard");
      return res.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load dashboard statistics. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    students: [],
    teachers: [],
    projects: [],
    users: [],
    stats: null,
    loading: false,
    error: null,
    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createStudent.fulfilled, (state, action) => {
        if (state.users) {
          state.users.unshift(action.payload);
        }
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.map((user) =>
            user._id === action.payload._id
              ? { ...user, ...action.payload }
              : user,
          );
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.filter(
            (user) => user._id !== action.payload,
          );
        }
      })
      .addCase(createTeacher.fulfilled, (state, action) => {
        if (state.users) {
          state.users.unshift(action.payload);
        }
      })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.map((user) =>
            user._id === action.payload._id
              ? { ...user, ...action.payload }
              : user,
          );
        }
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => {
        if (state.users) {
          state.users = state.users.filter(
            (user) => user._id !== action.payload,
          );
        }
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
      })
      .addCase(getAllProjects.fulfilled, (state, action) => {
        state.projects = action.payload.projects;
      })
      .addCase(getDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.dashboardError = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboard = action.payload;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardError = action.payload;
      });
  },
});

export default adminSlice.reducer;
