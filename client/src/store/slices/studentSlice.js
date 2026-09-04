import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

export const submitProjectProposal = createAsyncThunk(
  "student/submitProjectProposal",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/student/proposal", data);
      toast.success(response.data.message || "Proposal submitted successfully");
      return response.data.data?.project || response.data.data || response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to submit proposal.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const uploadProjectFiles = createAsyncThunk(
  "student/uploadProjectFiles",
  async ({ projectId, files }, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await axiosInstance.post(
        `/student/upload/${projectId}`,
        formData,
      );
      toast.success(response.data.message || "Files uploaded successfully");
      return response.data.data?.project || response.data.data || response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to upload files.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchProject = createAsyncThunk(
  "student/fetchProject",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/project");
      return response.data.data?.project || null;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load project details.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getSupervisor = createAsyncThunk(
  "student/getSupervisor",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/getSupervisor");
      return response.data.data?.supervisor || null;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load assigned supervisor.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchAllSupervisors = createAsyncThunk(
  "student/fetchAllSupervisors",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/fetch-supervisors");
      return response.data.data?.supervisors || [];
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load supervisors.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const requestSupervisor = createAsyncThunk(
  "student/requestSupervisor",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post(
        "/student/request-supervisor",
        data,
      );
      toast.success(
        response.data.message || "Supervisor request sent successfully",
      );
      thunkAPI.dispatch(getSupervisor());
      return response.data.data?.request || {};
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to Request supervisor.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const uploadFiles = createAsyncThunk(
  "student/uploadFiles",
  async ({ projectId, files }, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      const res = await axiosInstance.post(
        `/student/upload/${projectId}`,
        formData,
        {
          "Content-Type": "multipart/form-data",
        },
      );
      toast.success(res.data.message || "Files uploaded successfully");
      return res.data.data?.project || res.data.data || res.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to upload files.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchDashboardStats = createAsyncThunk(
  "student/fetchDashboardStats",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        "/student/fetch-dashboard-stats",
      );
      return response.data.data || response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load dashboard stats.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const getFeedback = createAsyncThunk(
  "student/getFeedback",
  async (projectId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(
        `/student/feedback/${projectId}`,
      );
      return response.data.data?.feedback || response.data.data || [];
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load feedback.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const downloadFile = createAsyncThunk(
  "student/downloadFile",
  async ({ projectId, fileId }, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/student/download/${projectId}/${fileId}`,
        { responseType: "blob" },
      );

     return {blob : res.data ,projectId, fileId};
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to download file.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

const studentSlice = createSlice({
  name: "student",
  initialState: {
    project: null,
    files: [],
    supervisors: [],
    dashboardStats: [],
    supervisor: null,
    deadlines: [],
    feedback: [],
    status: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitProjectProposal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitProjectProposal.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload?.project || action.payload;
      })
      .addCase(submitProjectProposal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload?.project || action.payload || null;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadProjectFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProjectFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload;
        state.files = action.payload?.files || [];
      })
      .addCase(uploadProjectFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(uploadFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.project = action.payload;
        state.files = action.payload?.files || [];
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(getSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSupervisor.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisor = action.payload?.supervisor || action.payload;
      })
      .addCase(getSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchAllSupervisors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSupervisors.fulfilled, (state, action) => {
        state.loading = false;
        state.supervisors = action.payload?.supervisors || action.payload || [];
      })
      .addCase(fetchAllSupervisors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(requestSupervisor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestSupervisor.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(requestSupervisor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload || {};
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(getFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload || [];
      })
      .addCase(getFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default studentSlice.reducer;
