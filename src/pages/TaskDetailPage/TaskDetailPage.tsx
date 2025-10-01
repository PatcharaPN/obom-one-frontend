import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchTaskById } from "../../features/redux/TaskSlice";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { renderStatusBadge } from "../../components/StatusBadge";
import { formatThaiDate } from "../../utils/formatThaiDate";
import PdfThumbnail from "../../components/PDFThumbnail";
import SuccessModal from "../../components/SuccessPopup";
import axios from "axios";

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const approveDate = new Date().toISOString();
  const { currentTask, loading } = useAppSelector<any>((state) => state.task);
  const printedFiles = useAppSelector((state) => state.print);
  const [successOpen, setSuccessOpen] = useState(false);
  const allPrinted = currentTask?.tasks
    ? currentTask.tasks.every((t: any) => {
        const files = Array.isArray(t.attachments)
          ? t.attachments
          : [t.attachments];
        return files.every((file: string) => printedFiles[file]);
      })
    : false;
  useEffect(() => {
    if (taskId) dispatch(fetchTaskById(taskId));
  }, [taskId, dispatch]);

  const handleApprove = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/task/${taskId}/approve`,
        {
          approveDate: approveDate,
        }
      );

      if (res.status !== 200) throw new Error("Approve failed");
      setSuccessOpen(true);

      setTimeout(() => {
        setSuccessOpen(false);
        navigate(-1);
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  if (loading || !currentTask) return <div>Loading...</div>;
  return (
    <div className="grid grid-rows-[350px_1fr] h-full">
      {/* Header / Info Section */}
      <div className="p-6 bg-white shadow-md grid grid-cols-2 gap-4">
        <div>
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-lg font-medium text-gray-600 cursor-pointer hover:text-gray-800 mb-4"
          >
            <Icon icon="lets-icons:back" width="20" height="20" />
            <span>ย้อนกลับ</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">{currentTask.titleName}</h1>

          <div className="flex items-center gap-2 mb-4">
            {renderStatusBadge(currentTask.taskType)}
          </div>

          <div className="flex flex-wrap gap-5 mb-2 text-gray-700">
            <p>
              <span className="font-semibold">บริษัท:</span>{" "}
              {currentTask.companyName} ({currentTask.companyPrefix})
            </p>
            <p>
              <span className="font-semibold">PO/QT:</span>{" "}
              {currentTask.poNumber} / {currentTask.qtNumber}
            </p>
          </div>

          <div className="mb-2 text-gray-700 flex flex-col gap-2">
            <span className="font-semibold">ฝ่ายขายที่ดูแล:</span>{" "}
            <div className="flex items-center gap-2">
              <img
                src={
                  currentTask.sale?.profilePic
                    ? `${import.meta.env.VITE_BASE_URL}/api/${
                        currentTask.sale.profilePic
                      }`
                    : "/default.png"
                }
                alt={currentTask.sale?.name || "ไม่ระบุ"}
                className="rounded-full w-6 h-6 object-cover"
              />
              {currentTask.sale?.name || "ไม่ระบุ"} {currentTask.sale?.surname}
            </div>
          </div>
          <p className="mb-2 text-gray-700">
            <span className="font-semibold">ประเภทงาน:</span>{" "}
            {currentTask.taskType.join(", ")}
          </p>

          <p className="mb-2">
            <span className="font-semibold">สถานะอนุมัติ:</span>{" "}
            <span
              className={`font-semibold ${
                currentTask.isApprove ? "text-green-600" : "text-orange-600"
              }`}
            >
              {currentTask.isApprove ? "อนุมัติแล้ว" : "รออนุมัติ"}
            </span>
          </p>

          <p className="mb-2">
            <span className="font-semibold">วันส่งมอบงาน:</span>{" "}
            {formatThaiDate(currentTask.dueDate?.toLocaleString() || "")}
          </p>
        </div>

        <div className="grid h-full w-full grid-rows-[auto_1fr] gap-4">
          <div className="flex justify-end">
            {currentTask.isApprove === false && allPrinted && (
              <button
                onClick={handleApprove}
                className="bg-green-600 hover:brightness-70 transition-colors duration-300 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium"
              >
                <Icon icon="simple-line-icons:check" width="20" height="20" />
                อนุมัติขึ้นงาน
              </button>
            )}
          </div>

          <div className="w-full border border-black/10 rounded-xl p-4">
            <p>รายละเอียดเพิ่มเติม:</p>
            <div className="text-left">
              {currentTask.description &&
              currentTask.description.trim() !== "" ? (
                <span>{currentTask.description}</span>
              ) : (
                <span className="text-gray-500">ไม่มีรายละเอียดเพิ่มเติม</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 bg-gray-200 overflow-auto">
        <p className="mt-4 text-gray-600">
          {currentTask.tasks.map((t: any, idx: any) => (
            <PdfThumbnail
              key={idx}
              filePath={`${import.meta.env.VITE_BASE_URL}/api/uploads/task/${
                t.attachments
              }`}
              fileUrl={t.attachments.toString()}
              filename={t.attachments.toString()}
              material={t.material}
            />
          ))}
        </p>
      </div>

      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

export default TaskDetailPage;
