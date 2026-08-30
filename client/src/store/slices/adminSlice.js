import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const createStudent = createAsyncThunk(
  "admin/createStudent",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-student", data);
      toast.success(res.data.message || "Student created successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to create student. Please try again.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateStudent = createAsyncThunk(
  "admin/updateStudent",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-student/${id}`, data);
      toast.success(res.data.message || "Student updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update student. Please try again.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteStudent = createAsyncThunk(
  "admin/deleteStudent",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-student/${id}`);
      toast.success(res.data.message || "Student deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to delete student. Please try again.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const createTeacher = createAsyncThunk(
  "admin/createTeacher",
  async (data, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/admin/create-teacher", data);
      toast.success(res.data.message || "Teacher created successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to create teacher. Please try again.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const updateTeacher = createAsyncThunk(
  "admin/updateTeacher",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/admin/update-teacher/${id}`, data);
      toast.success(res.data.message || "Teacher updated successfully");
      return res.data.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update teacher. Please try again.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteTeacher = createAsyncThunk(
  "admin/deleteTeacher",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/admin/delete-teacher/${id}`);
      toast.success(res.data.message || "Teacher deleted successfully");
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to delete teacher. Please try again.";
      toast.error(message);
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
      toast.error(message);
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
      });
  },
});

export default adminSlice.reducer;
