import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage";
import MainLayout from "../layouts/MainLayout";
import StatusTrackingPage from "../pages/StatusTrackingPage/StatusTrackingPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import TaskDetailPage from "../pages/TaskDetailPage/TaskDetailPage";

import PDFPrintPageWrapper from "../layouts/PDFPageWrapper";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<MainLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/status-tracking" element={<StatusTrackingPage />} />
        <Route path="/Task/:taskId" element={<TaskDetailPage />} />
        <Route path="/print/:taskId" element={<PDFPrintPageWrapper />} />
      </Route>

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};
