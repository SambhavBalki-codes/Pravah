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
      thunkAPI.dispatch(fetchMyRequests());
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
      return response.data.data?.feedbacks || response.data.data || [];
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

export const fetchFeedbackHistory = createAsyncThunk(
  "student/fetchFeedbackHistory",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/feedback-history");
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load feedback.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markFeedbackRead = createAsyncThunk(
  "student/markFeedbackRead",
  async (feedbackId, thunkAPI) => {
    try {
      await axiosInstance.put(`/student/feedback/${feedbackId}/read`);
      return feedbackId;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to mark feedback as read.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const markAllFeedbackRead = createAsyncThunk(
  "student/markAllFeedbackRead",
  async (_, thunkAPI) => {
    try {
      await axiosInstance.put("/student/feedback/read-all");
      return true;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to mark feedback as read.";
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchMyRequests = createAsyncThunk(
  "student/fetchMyRequests",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/student/my-requests");
      return response.data.data?.requests || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to load your requests.",
      );
    }
  },
);

export const cancelSupervisorRequest = createAsyncThunk(
  "student/cancelSupervisorRequest",
  async (requestId, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/student/requests/${requestId}/cancel`);
      toast.success(response.data.message || "Request cancelled");
      return requestId;
    } catch (error) {
      const message = error.response?.data?.message || "Failed to cancel the request.";
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
    feedbackHistory: [],
    feedbackSummary: { total: 0, unread: 0, revisionRequired: 0 },
    feedbackLoading: false,
    feedbackError: null,
    myRequests: [],
    requestsLoading: false,
    requestsError: null,
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
      })
      .addCase(fetchFeedbackHistory.pending, (state) => {
        state.feedbackLoading = true;
        state.feedbackError = null;
      })
      .addCase(fetchFeedbackHistory.fulfilled, (state, action) => {
        state.feedbackLoading = false;
        state.feedbackHistory = action.payload?.feedbacks || [];
        state.feedbackSummary = action.payload?.summary || state.feedbackSummary;
      })
      .addCase(fetchFeedbackHistory.rejected, (state, action) => {
        state.feedbackLoading = false;
        state.feedbackError = action.payload;
      })
      .addCase(markFeedbackRead.fulfilled, (state, action) => {
        const item = state.feedbackHistory.find((f) => f._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.feedbackSummary.unread = Math.max(0, state.feedbackSummary.unread - 1);
        }
      })
            .addCase(markAllFeedbackRead.fulfilled, (state) => {
        state.feedbackHistory.forEach((f) => {
          f.isRead = true;
        });
        state.feedbackSummary.unread = 0;
      })
      .addCase(fetchMyRequests.pending, (state) => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchMyRequests.fulfilled, (state, action) => {
        state.requestsLoading = false;
        state.myRequests = action.payload;
      })
      .addCase(fetchMyRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError = action.payload;
      })
      .addCase(cancelSupervisorRequest.fulfilled, (state, action) => {
        const item = state.myRequests.find((r) => r._id === action.payload);
        if (item) item.status = "cancelled";
      });
  },
});

export default studentSlice.reducer;
