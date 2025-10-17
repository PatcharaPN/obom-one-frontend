import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../contexts/axiosInstance";
const token = localStorage.getItem("accessToken");
const user = localStorage.getItem("user");
// Define a type for the slice state Auth
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  error: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: !!token,
  token: token || null,
  user: user ? JSON.parse(user) : null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    thunkAPI
  ) => {
    try {
      const res = await axiosInstance.post("auth/login", { email, password });
      const { token } = res.data.data;

      localStorage.setItem("accessToken", token);

      // localStorage.setItem("recentUser", res.data.data);
      return res.data.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);
export const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("accessToken", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout } = AuthSlice.actions;

export default AuthSlice.reducer;
