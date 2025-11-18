import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage";
import MainLayout from "../layouts/MainLayout";
import StatusTrackingPage from "../pages/StatusTrackingPage/StatusTrackingPage";
import TaskDetailPage from "../pages/TaskDetailPage/TaskDetailPage";
import PDFPrintPage from "../pages/PDFPrintPage/PDFPrintPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import PrivateRoute from "../layouts/PrivateRoute";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import TaskOverviewPage from "../pages/TaskOverviewPage/TaskOverviewPage";
import DrawingPage from "../pages/DrawingPage/DrawingPage";

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
        />{" "}
        <Route
          path="/Dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />{" "}
        <Route
          path="/Overview"
          element={
            <PrivateRoute>
              <TaskOverviewPage />
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
        />{" "}
        <Route
          path="/drawing"
          element={
            <PrivateRoute>
              <DrawingPage />
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
              <PDFPrintPage
                drawingInfo={{}}
                fileUrl={""}
                isOpen={false}
                onClose={function (): void {
                  throw new Error("Function not implemented.");
                }}
              />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
};
