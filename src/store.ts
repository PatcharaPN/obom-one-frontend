import { configureStore } from "@reduxjs/toolkit";
import AuthReducer from "./features/redux/AuthSlice";
import TaskReducer from "./features/redux/TaskSlice";
import UserReducer from "./features/redux/UserSlice";
import PrintReducer from "./features/redux/PrintSlice";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";

const store = configureStore({
  reducer: {
    auth: AuthReducer,
    task: TaskReducer,
    user: UserReducer,
    print: PrintReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export default store;
