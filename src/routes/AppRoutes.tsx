import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage";
import MainLayout from "../layouts/MainLayout";
import StatusTrackingPage from "../pages/StatusTrackingPage/StatusTrackingPage";
import TaskDetailPage from "../pages/TaskDetailPage/TaskDetailPage";
import PDFPrintPage from "../pages/PDFPrintPage/PDFPrintPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import PrivateRoute from "../layouts/PrivateRoute";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route element={<MainLayout />}>
        {/* <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        /> */}
        <Route
          path="/Home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/status-tracking"
          element={
            <PrivateRoute>
              <StatusTrackingPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/Task/:taskId"
          element={
            <PrivateRoute>
              <TaskDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/print/*"
          element={
            <PrivateRoute>
              <PDFPrintPage fileUrl={""} />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
};
