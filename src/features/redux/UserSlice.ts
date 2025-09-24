import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../contexts/axiosInstance";
import type { IUser, UserState } from "../../types/task";

const initialState: UserState = {
  users: [],
  sales: [],
  loading: false,
  error: null,
};

export const fetchSale = createAsyncThunk<IUser[]>(
  "user/fetchSale",
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get("/auth/sale");
      // API ส่งกลับ users ไม่ใช่ tasks
      return response.data.users as IUser[];
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSale.fulfilled, (state, action) => {
        state.loading = false;
        state.sales = action.payload;
      })
      .addCase(fetchSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
