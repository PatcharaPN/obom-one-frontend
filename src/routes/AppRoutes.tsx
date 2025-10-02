import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage/HomePage";
import MainLayout from "../layouts/MainLayout";
import StatusTrackingPage from "../pages/StatusTrackingPage/StatusTrackingPage";

import TaskDetailPage from "../pages/TaskDetailPage/TaskDetailPage";

import PDFPrintPageWrapper from "../layouts/PDFPageWrapper";
import PDFPrintPage from "../pages/PDFPrintPage/PDFPrintPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<LoginPage />} /> */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/status-tracking" element={<StatusTrackingPage />} />
        <Route path="/Task/:taskId" element={<TaskDetailPage />} />
        <Route path="/print/*" element={<PDFPrintPage fileUrl={""} />} />
      </Route>

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};
