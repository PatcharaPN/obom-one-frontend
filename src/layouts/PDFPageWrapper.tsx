import { useParams } from "react-router-dom";
import PDFPrintPage from "../pages/PDFPrintPage/PDFPrintPage";

const PDFPrintPageWrapper: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  if (!taskId) return <div>File not found</div>;

  const fileUrl = `${import.meta.env.VITE_BASE_URL}/api/uploads/task/${taskId}`;

  return <PDFPrintPage fileUrl={fileUrl} />;
};

export default PDFPrintPageWrapper;
