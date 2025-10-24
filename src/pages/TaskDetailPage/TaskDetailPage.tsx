import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchTaskById } from "../../features/redux/TaskSlice";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { renderStatusBadge } from "../../components/StatusBadge";
import { formatThaiDate, formatThaiDateTime } from "../../utils/formatThaiDate";
import PdfThumbnail from "../../components/PDFThumbnail";
import SuccessModal from "../../components/SuccessPopup";
import axios from "axios";
import type { TaskState } from "../../types/task";
import { Bounce, toast } from "react-toastify";

const TaskDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const approveDate = new Date().toISOString();
  const { currentTask, loading } = useAppSelector<TaskState>(
    (state) => state.task
  );
  const user = useAppSelector((state) => state.auth.user);
  const [checkPrint, setCheckPrint] = useState<{ [key: string]: boolean }>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const canApprove = user?.role === "Sale Support 2" || user?.role === "IT";
  useEffect(() => {
    if (taskId) dispatch(fetchTaskById(taskId));
  }, [taskId, dispatch]);
  const allPrinted =
    currentTask?.tasks?.every((t) =>
      t.attachments?.every((file) => checkPrint[file.path])
    ) ?? false;
  const handleApprove = async () => {
    if (!canApprove) {
      toast.error("ไม่มีสิทธิ์ในการอนุมัติ", {
        position: "bottom-right",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    // ✅ เช็กว่าในทุก subtask ต้องมี attachments อย่างน้อย 1 ไฟล์
    const hasMissingFiles =
      currentTask?.tasks?.some(
        (t) => !t.attachments || t.attachments.length === 0
      ) ?? true;

    if (hasMissingFiles) {
      toast.error("ไม่สามารถอนุมัติได้: มีงานที่ยังไม่ได้แนบไฟล์", {
        position: "bottom-right",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    // ✅ ถ้าเช็กผ่าน ค่อยอนุมัติ
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/task/${taskId}/approve`,
        { approveDate }
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

  const handleFilePrinted = (filename: string) => {
    setCheckPrint((prev) => ({ ...prev, [filename]: true }));
  };
  if (loading || !currentTask) return <div>Loading...</div>;
  return (
    <div className="grid grid-rows-[360px_1fr] h-full">
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
            <div className="flex gap-2">
              {" "}
              <span className="font-semibold">ประเภทงาน:</span>{" "}
              <p>
                {currentTask.companyName === "J"
                  ? "Jig Gauge"
                  : currentTask.companyName === "S"
                  ? "Single Gauge"
                  : currentTask.companyName}
              </p>
            </div>
            <p>
              <span className="font-semibold">ชื่อบริษัทย่อ:</span> (
              {currentTask.companyPrefix})
            </p>
            <p>
              <span className="font-semibold">PO/QT:</span>{" "}
              {currentTask.poNumber} / {currentTask.qtNumber}
            </p>
          </div>

          <div className="mb-2 text-gray-700 flex flex-col gap-2">
            <span className="font-semibold">ฝ่ายขายที่ดูแล:</span>{" "}
            <div className="flex items-center gap-2 bg-blue-600/20 w-fit px-2 py-1 rounded-full">
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
              {currentTask.isApprove
                ? `อนุมัติแล้ว (${formatThaiDateTime(currentTask.approveDate)})`
                : "รออนุมัติ"}
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
            <div className="text-left py-2">
              {currentTask.description &&
              currentTask.description.trim() !== "" ? (
                <span className="text-4xl bg-blue-600/20 text-blue-600">
                  {currentTask.description}
                </span>
              ) : (
                <span className="text-gray-500">ไม่มีรายละเอียดเพิ่มเติม</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-6 bg-gray-200 overflow-auto">
        <div className="mt-4 text-gray-600 flex flex-wrap gap-4">
          {currentTask.tasks?.map((subtask, sIdx) =>
            subtask.attachments?.map((file, idx) => {
              return (
                <div key={`${sIdx}-${idx}`} className="basis-1/6">
                  <PdfThumbnail
                    taskCode={subtask.taskID}
                    quantity={subtask.quantity}
                    filePath={`${import.meta.env.VITE_BASE_URL}/api${
                      file.path
                    }`}
                    fileUrl={`${import.meta.env.VITE_BASE_URL}/api${file.path}`}
                    filename={file.originalName}
                    material={subtask.material}
                    onPrint={() => handleFilePrinted(file.path)}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
    </div>
  );
};

export default TaskDetailPage;
