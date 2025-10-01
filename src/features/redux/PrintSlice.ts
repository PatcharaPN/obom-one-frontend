// slice/printSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface PrintState {
  [fileUrl: string]: boolean;
}

const initialState: PrintState = {};

const printSlice = createSlice({
  name: "print",
  initialState,
  reducers: {
    markPrinted: (state, action: PayloadAction<string>) => {
      state[action.payload] = true;
    },
  },
});

export const { markPrinted } = printSlice.actions;
export default printSlice.reducer;
