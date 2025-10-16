import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../contexts/axiosInstance";
import type { Task, TaskState } from "../../types/task";

const initialState: TaskState = {
  currentTask: null,
  tasks: [],
  summaryTasks: [],
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

export const fetchAllTask = createAsyncThunk<Task[]>(
  "task/fetchAllTasks",
  async () => {
    const res = await axiosInstance.get("/task/tasks");
    return res.data;
  }
);

export const updateTask = createAsyncThunk(
  "task/updateTask",
  async ({ id, data }: { id: string; data: FormData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/task/update/${id}`, data);
      return response.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error?.response?.data || "เกิดข้อผิดพลาด"
      );
    }
  }
);
export const deleteTask = createAsyncThunk(
  "task/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/task/delete/${id}`);
      return { id, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
  },
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
      })
      .addCase(fetchAllTask.fulfilled, (state, action) => {
        state.loading = false;
        state.summaryTasks = action.payload;
      })
      .addCase(fetchAllTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch task";
      })
      .addCase(fetchAllTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload.id;

        state.tasks = state.tasks.filter((t) => t._id !== deletedId);

        if (state.currentTask && state.currentTask._id === deletedId) {
          state.currentTask = null;
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;

        // แทนที่ task เดิมด้วยตัวใหม่จาก action.payload
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(
          (task) => task._id === updatedTask._id
        );

        if (index !== -1) {
          state.tasks[index] = updatedTask;
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const { clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
