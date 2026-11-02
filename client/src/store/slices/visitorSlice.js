import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import appToast from "../../lib/toast";

const errorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const registerVisitor = createAsyncThunk(
  "visitor/register",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/visitor/register", data);
      appToast.success(response.data.message || "Visitor account created");
      return response.data.data.user;
    } catch (error) {
      const message = errorMessage(error, "Unable to create visitor account.");
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const loginVisitor = createAsyncThunk(
  "visitor/login",
  async (data, thunkAPI) => {
    try {
      const response = await axiosInstance.post("/visitor/login", data);
      appToast.success(response.data.message || "Welcome to Pravah");
      return response.data.data.user;
    } catch (error) {
      const message = errorMessage(error, "Unable to sign in as visitor.");
      appToast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const fetchPublicProjects = createAsyncThunk(
  "visitor/projects",
  async (params = {}, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/visitor/projects", { params });
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(errorMessage(error, "Unable to load projects."));
    }
  },
);

export const fetchPublicProject = createAsyncThunk(
  "visitor/project",
  async (projectId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/visitor/projects/${projectId}`);
      return response.data.data.project;
    } catch (error) {
      return thunkAPI.rejectWithValue(errorMessage(error, "Unable to load project."));
    }
  },
);

export const fetchChatHistory = createAsyncThunk(
  "visitor/chatHistory",
  async (projectId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/visitor/projects/${projectId}/chat`);
      return response.data.data.messages;
    } catch (error) {
      return thunkAPI.rejectWithValue(errorMessage(error, "Unable to load chat history."));
    }
  },
);

export const sendVisitorMessage = createAsyncThunk(
  "visitor/sendMessage",
  async ({ projectId, message }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/visitor/projects/${projectId}/chat`, { message });
      return response.data.data;
    } catch (error) {
      const messageText = errorMessage(error, "Unable to get an AI response.");
      appToast.error(messageText);
      return thunkAPI.rejectWithValue(messageText);
    }
  },
);

const visitorSlice = createSlice({
  name: "visitor",
  initialState: {
    projects: [],
    pagination: null,
    selectedProject: null,
    messages: [],
    loading: false,
    projectLoading: false,
    chatLoading: false,
    error: null,
  },
  reducers: {
    clearVisitorProject: (state) => {
      state.selectedProject = null;
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    appendAssistantMessage: (state, action) => {
      const last = state.messages[state.messages.length - 1];
      if (last?.role === "assistant") last.content += action.payload;
    },
    setChatLoading: (state, action) => {
      state.chatLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginVisitor.pending, (state) => { state.loading = true; })
      .addCase(loginVisitor.fulfilled, (state) => { state.loading = false; })
      .addCase(loginVisitor.rejected, (state) => { state.loading = false; })
      .addCase(registerVisitor.pending, (state) => { state.loading = true; })
      .addCase(registerVisitor.fulfilled, (state) => { state.loading = false; })
      .addCase(registerVisitor.rejected, (state) => { state.loading = false; })
      .addCase(fetchPublicProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchPublicProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicProject.pending, (state) => {
        state.projectLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicProject.fulfilled, (state, action) => {
        state.projectLoading = false;
        state.selectedProject = action.payload;
      })
      .addCase(fetchPublicProject.rejected, (state, action) => {
        state.projectLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.messages = action.payload || [];
      })
      .addCase(sendVisitorMessage.pending, (state, action) => {
        state.chatLoading = true;
        state.messages.push({ role: "user", content: action.meta.arg.message });
      })
      .addCase(sendVisitorMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.messages.push({
          role: "assistant",
          content: action.payload.message,
          sources: action.payload.sources || [],
        });
      })
      .addCase(sendVisitorMessage.rejected, (state) => {
        state.chatLoading = false;
      });
  },
});

export const {
  clearVisitorProject,
  addMessage,
  appendAssistantMessage,
  setChatLoading,
} = visitorSlice.actions;
export default visitorSlice.reducer;
