import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

export const login = createAsyncThunk("login", async (data, thunkAPI) => {
  try {
    const response = await axiosInstance.post("/auth/login", data);
    appToast.success(response.data.message);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      "Unable to connect to the server. Please try again.";
    appToast.error(message);
    return thunkAPI.rejectWithValue(message);
  }
});

export const forgotPassword = createAsyncThunk(
  "forgotPassword",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/auth/password/forgot", data);
      appToast.success(response.data.message || "Password reset link sent.");
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to send reset email. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  "resetPassword",
  async ({ token, password, confirmPassword }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(
        `/auth/password/reset/${token}`,
        {
          password,
          confirmPassword,
        },
      );
      appToast.success(response.data.message || "Password reset successful.");
      return response.data.user;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to reset your password. Please try again.";
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getUser = createAsyncThunk("auth/me", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/auth/me");
    return response.data.user;
  } catch (error) {
    const message =
      error.response?.data?.message || "Unable to fetch user details.";
    return thunkAPI.rejectWithValue(message);
  }
});

export const logout = createAsyncThunk("logout", async (_, thunkAPI) => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    appToast.success(response.data.message || "Logged out successfully.");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Unable to log out. Please try again.";
    appToast.error(message);
    return thunkAPI.rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
        state.authUser = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.authUser = action.payload.user;
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.isRequestingForToken = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isRequestingForToken = false;
      })
      .addCase(forgotPassword.rejected, (state) => {
        state.isRequestingForToken = false;
      })
      .addCase(resetPassword.pending, (state) => {
        state.isUpdatingPassword = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isUpdatingPassword = false;
        state.authUser = action.payload;
      })
      .addCase(resetPassword.rejected, (state) => {
        state.isUpdatingPassword = false;
      })
      .addCase(getUser.pending, (state) => {
        state.isCheckingAuth = true;
        state.authUser = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.authUser = action.payload;
      })
      .addCase(getUser.rejected, (state) => {
        state.isCheckingAuth = false;
        state.authUser = null;
      })
      .addCase(logout.pending, (state) => {
        state.isCheckingAuth = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.authUser = null;
        state.isCheckingAuth = false;
      })
      .addCase(logout.rejected, (state) => {
        state.authUser = null;
        state.isCheckingAuth = false;
      });
  },
});

export default authSlice.reducer;
