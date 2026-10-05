import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

const failure = (error, fallback) => error.response?.data?.message || fallback;

export const getTeacherDashboard = createAsyncThunk(
  "teacher/getTeacherDashboard",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/teacher/dashboard");
      return response.data.data;
    } catch (error) {
      const message = failure(error, "Failed to load teacher dashboard.");
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchAssignedStudents = createAsyncThunk(
  "teacher/fetchAssignedStudents",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/teacher/students?limit=100");
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to load assigned students."));
    }
  },
);

export const fetchAssignedStudentDetail = createAsyncThunk(
  "teacher/fetchAssignedStudentDetail",
  async (studentId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/teacher/students/${studentId}`);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to load student details."));
    }
  },
);

export const fetchTeacherFiles = createAsyncThunk(
  "teacher/fetchTeacherFiles",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/teacher/files");
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to load files."));
    }
  },
);

// action: "reviewed" | "revision_requested" (message is required for revision_requested)
export const reviewTeacherFile = createAsyncThunk(
  "teacher/reviewTeacherFile",
  async ({ projectId, fileId, action, message }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(
        `/teacher/projects/${projectId}/files/${fileId}/review`,
        { action, message },
      );
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to update file review."));
    }
  },
);

export const addTeacherFeedback = createAsyncThunk(
  "teacher/addTeacherFeedback",
  async ({ projectId, ...body }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/teacher/projects/${projectId}/feedback`, body);
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(failure(error, "Failed to send feedback."));
    }
  },
);

const teacherSlice = createSlice({
  name: "teacher",
  initialState: {
    dashboard: null,
    dashboardLoading: false,
    dashboardError: null,

    students: [],
    studentsLoading: false,
    studentsError: null,

    studentDetail: null,
    detailLoading: false,
    detailError: null,

    files: [],
    filesSummary: { total: 0, pending: 0, reviewed: 0, revisionRequested: 0 },
    filesLoading: false,
    filesError: null,
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
      })

      .addCase(fetchAssignedStudents.pending, (state) => {
        state.studentsLoading = true;
        state.studentsError = null;
      })
      .addCase(fetchAssignedStudents.fulfilled, (state, action) => {
        state.studentsLoading = false;
        state.students = action.payload?.students || [];
      })
      .addCase(fetchAssignedStudents.rejected, (state, action) => {
        state.studentsLoading = false;
        state.studentsError = action.payload;
      })

      .addCase(fetchAssignedStudentDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.studentDetail = null;
      })
      .addCase(fetchAssignedStudentDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.studentDetail = action.payload;
      })
      .addCase(fetchAssignedStudentDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })

      .addCase(fetchTeacherFiles.pending, (state) => {
        state.filesLoading = true;
        state.filesError = null;
      })
      .addCase(fetchTeacherFiles.fulfilled, (state, action) => {
        state.filesLoading = false;
        state.files = action.payload?.files || [];
        state.filesSummary = action.payload?.summary || state.filesSummary;
      })
      .addCase(fetchTeacherFiles.rejected, (state, action) => {
        state.filesLoading = false;
        state.filesError = action.payload;
      });
  },
});

export default teacherSlice.reducer;