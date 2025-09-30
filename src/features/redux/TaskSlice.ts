import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../contexts/axiosInstance";
import type { Task, TaskState } from "../../types/task";

const initialState: TaskState = {
  currentTask: null,
  tasks: [],
  loading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk<Task[]>(
  "task/fetchTasks",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/task/getAllTasks");
      console.log(res.data);
      return res.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  "task/fetchById",
  async (taskId: string) => {
    const res = await axiosInstance.get(`/task/${taskId}`);
    return res.data;
  }
);

export const createTask = createAsyncThunk(
  "task/create",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/task/create", formData, {
        headers: {},
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload.task);
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTask = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch task";
      });
  },
});

export default taskSlice.reducer;
