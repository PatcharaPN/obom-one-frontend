import Divider from "../../components/Divider";
import PrimaryButton from "../../components/PrimaryButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DetailModal from "../../components/DetailModal";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  clearCurrentTask,
  fetchTaskById,
  fetchTasks,
} from "../../features/redux/TaskSlice";
import TaskDetail from "../../components/TaskDetail";
import { renderStatusBadge } from "../../components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { formatThaiDate, formatThaiDateTime } from "../../utils/formatThaiDate";
import DashboardCard from "../../components/DashboardCard";
import { Bounce, toast } from "react-toastify";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentTask, tasks } = useAppSelector((state) => state.task);

  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [selectedInLine, setSelectedInLine] = useState<string[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [openPending, setOpenPending] = useState(true);
  const [openInLine, setOpenInLine] = useState(true);
  const [taskDataToEdit, setTaskDataToEdit] = useState<any>(null);

  const pendingTasks = (tasks || []).filter((t: any) => !t.isApprove);
  const inLineTasks = (tasks || []).filter((t: any) => t.isApprove);

  const user = useAppSelector((state) => state.auth.user);
  const createRoleCheck = user?.role === "Sale Support" || "IT";
  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // เมื่อดึง currentTask มาและเปิด modal
  useEffect(() => {
    if (currentTask && isDetailModalOpen && !taskDataToEdit) {
      setTaskDataToEdit(currentTask);
    }
  }, [currentTask, isDetailModalOpen]);

  const handleSelectRow = (id: string, type: "pending" | "inline") => {
    if (type === "pending") {
      setSelectedPending((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedInLine((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAll = (
    data: any[],
    type: "pending" | "inline",
    checked: boolean
  ) => {
    if (type === "pending") {
      setSelectedPending(checked ? data.map((d) => d._id) : []);
    } else {
      setSelectedInLine(checked ? data.map((d) => d._id) : []);
    }
  };

  const handleCreateTask = () => {
    dispatch(clearCurrentTask());
    if (!createRoleCheck) {
      console.log("ไม่อนุญาตให้สร้างคำขอใหม่");
      toast.error("คุณไม่มีสิทธิ์สร้างคำขอใหม่", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }
    setTaskDataToEdit(null);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="grid grid-rows-[360px_1fr] gap-4">
      {/* Dashboard + Quick Actions + Filter */}
      <div className="flex flex-col gap-4 overflow-x-auto p-2">
        <div className="flex gap-4 h-fit py-2">
          <DashboardCard count={pendingTasks.length} type="คำขอรออนุมัติ" />
          <DashboardCard count={inLineTasks.length} type="อนุมัติแล้ว" />
          <DashboardCard count={tasks.length} type="รวมทั้งหมด" />
        </div>

        <div className="flex gap-2">
          <PrimaryButton
            label="สร้างคำขอใหม่"
            icon="mdi:plus"
            variant="primary"
            onClick={handleCreateTask}
          />
          <PrimaryButton
            label="ส่งออก Excel"
            variant="secondary"
            onClick={() => console.log("Export all tasks")}
          />
        </div>

        <div className="flex gap-2 items-center overflow-x-auto">
          <button className="px-4 py-1 rounded bg-blue-100 text-blue-500 hover:bg-blue-200 transition">
            ทั้งหมด
          </button>
          <button className="px-4 py-1 rounded bg-green-100 text-green-500 hover:bg-green-200 transition">
            อนุมัติแล้ว
          </button>
          <button className="px-4 py-1 rounded bg-yellow-100 text-yellow-500 hover:bg-yellow-200 transition">
            รออนุมัติ
          </button>
        </div>
      </div>

      <Divider />

      {/* Pending Requests */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setOpenPending(!openPending)}
      >
        <Typography>คำขอรออนุมัติ ({pendingTasks.length})</Typography>
        <IconButton size="small">
          <Icon
            icon={openPending ? "mdi:chevron-up" : "mdi:chevron-down"}
            width={24}
            height={24}
          />
        </IconButton>
      </div>
      <Collapse in={openPending}>
        <TableContainer component={Paper} className="max-h-[250px]">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="bg-blue-400/5">
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedPending.length === pendingTasks.length}
                    indeterminate={
                      selectedPending.length > 0 &&
                      selectedPending.length < pendingTasks.length
                    }
                    onChange={(e) =>
                      handleSelectAll(pendingTasks, "pending", e.target.checked)
                    }
                  />
                </TableCell>
                <TableCell>หัวข้อ</TableCell>
                <TableCell>รหัสการผลิต</TableCell>
                <TableCell>วัตถุดิบ</TableCell>
                <TableCell>กำหนดส่ง</TableCell>
                <TableCell>ผู้ดูแล</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    ไม่มีคำขอรออนุมัติ
                  </TableCell>
                </TableRow>
              ) : (
                pendingTasks.map((row) => (
                  <TableRow
                    onClick={() => navigate(`/Task/${row._id}`)}
                    key={row._id}
                    selected={selectedPending.includes(row._id || "")}
                    className="cursor-pointer hover:bg-blue-400/10 duration-300 transition-all"
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedPending.includes(row._id || "")}
                        onChange={() =>
                          handleSelectRow(row._id || "", "pending")
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-fit">
                        <p>{row.titleName}</p> {renderStatusBadge(row.taskType)}
                      </div>
                    </TableCell>
                    <TableCell>{row.companyName}</TableCell>
                    <TableCell>
                      {row.tasks && row.tasks.length > 0
                        ? row.tasks.map((t) => t.material).join(", ")
                        : "ไม่มีการขึ้นงาน"}
                    </TableCell>
                    <TableCell>
                      {formatThaiDate(row.dueDate?.toLocaleString() || "")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            row.sale?.profilePic
                              ? `${import.meta.env.VITE_BASE_URL}/api/${
                                  row.sale.profilePic
                                }`
                              : "/default.png"
                          }
                          alt={row.sale?.name || "ไม่ระบุ"}
                          className="rounded-full w-6 h-6 object-cover"
                        />
                        {row.sale.name} {row.sale.surname}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-[#FFF4E5] text-[#FF8C00] rounded-full text-sm">
                        รอการอนุมัติ
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDetailModalOpen(true);
                          setTaskDataToEdit(null);
                          dispatch(fetchTaskById(row._id || ""));
                        }}
                        className="text-blue-500/70"
                      >
                        แก้ไข
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>

      {/* Approved Requests */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setOpenInLine(!openInLine)}
      >
        <Typography>อนุมัติขึ้นงานแล้ว ({inLineTasks.length})</Typography>
        <IconButton size="small">
          <Icon
            icon={openInLine ? "mdi:chevron-up" : "mdi:chevron-down"}
            width={24}
            height={24}
          />
        </IconButton>
      </div>
      <Collapse in={openInLine}>
        <TableContainer component={Paper} className="max-h-[250px]">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="bg-blue-400/5">
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedInLine.length === inLineTasks.length}
                    indeterminate={
                      selectedInLine.length > 0 &&
                      selectedInLine.length < inLineTasks.length
                    }
                    onChange={(e) =>
                      handleSelectAll(inLineTasks, "inline", e.target.checked)
                    }
                  />
                </TableCell>
                <TableCell>หัวข้อ</TableCell>
                <TableCell>บริษัท</TableCell>
                <TableCell>วัตถุดิบ</TableCell>
                <TableCell>กำหนดส่ง</TableCell>
                <TableCell>ผู้ดูแล</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วัน/เวลาที่อนุมัติ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inLineTasks.map((row: any) => (
                <TableRow
                  onClick={() => navigate(`/Task/${row._id}`)}
                  key={row._id}
                  selected={selectedInLine.includes(row._id)}
                  className="cursor-pointer hover:bg-blue-400/10 duration-300 transition-all"
                >
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedInLine.includes(row._id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-fit">
                      <p>{row.titleName}</p> {renderStatusBadge(row.taskType)}
                    </div>
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>
                    {row.tasks.map((t: any) => t.material).join(", ")}
                  </TableCell>
                  <TableCell>
                    {formatThaiDate(row.dueDate?.toLocaleString() || "")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          row.sale?.profilePic
                            ? `${import.meta.env.VITE_BASE_URL}/api/${
                                row.sale.profilePic
                              }`
                            : "/default.png"
                        }
                        alt={row.sale?.name || "ไม่ระบุ"}
                        className="rounded-full w-6 h-6 object-cover"
                      />
                      {row.sale.name} {row.sale.surname}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-[#abffbc] text-[#147800] rounded-full text-sm">
                      อนุมัติขึ้นงานแล้ว
                    </span>
                  </TableCell>
                  <TableCell>{formatThaiDateTime(row.approveDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>

      <TaskDetail open={false} onClose={() => {}} taskId={null} />
      {isDetailModalOpen && (
        <DetailModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          taskDataToEdit={taskDataToEdit}
          setTaskDataToEdit={setTaskDataToEdit}
        />
      )}
    </div>
  );
};

export default HomePage;
