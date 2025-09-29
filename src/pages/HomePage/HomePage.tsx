import DashboardCard from "../../components/DashboardCard";
import Divider from "../../components/Divider";
import PrimaryButton from "../../components/PrimaryButton";
import { Searchbar } from "../../components/Searchbar";
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
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchTasks } from "../../features/redux/TaskSlice";
import TaskDetail from "../../components/TaskDetail";
import { renderStatusBadge } from "../../components/StatusBadge";

interface RequestData {
  id: string;
  title: string;
  company: string;
  dueDate: string;
  manager: string;
  material: string;
  taskType: "งานใหม่" | "งานแก้ไข" | "งานด่วน" | "งานเสีย";
}

const inLine: RequestData[] = [
  {
    id: "1",
    title: "ขึ้นงานคะ TBKK PO : QG9575",
    company: "TBKK",
    dueDate: "2025-09-25",
    manager: "Sale 1",
    material: "SKS3",
    taskType: "งานใหม่",
  },
];

const HomePage = () => {
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.task);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [selectedInLine, setSelectedInLine] = useState<string[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(true);
  const [openPending, setOpenPending] = useState(true);
  const [openInLine, setOpenInLine] = useState(true);
  const [isTaskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const pendingTasks = (tasks || []).filter((t) => !t.isApprove);

  const inLineTasks = (tasks || []).filter((t) => !t.isApprove);
  const handleSelectAll = (
    data: RequestData[],
    type: "pending" | "inline",
    checked: boolean
  ) => {
    if (type === "pending") {
      setSelectedPending(checked ? data.map((d) => d.id) : []);
    } else {
      setSelectedInLine(checked ? data.map((d) => d.id) : []);
    }
  };

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

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
  function formatThaiDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  const handleTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailOpen(true);
  };
  return (
    <div className="grid grid-rows-[280px_1fr] gap-4">
      <div className="flex gap-4 overflow-x-auto">
        <DashboardCard count={pendingTasks.length} type={"คำขอใหม่รออนุมัติ"} />
        <DashboardCard
          count={inLineTasks.length}
          type={"ขึ้นงานทั้งหมดวันนี้"}
        />
        <DashboardCard count={724} type={"ขึ้นงานทั้งหมดสัปดาห์นี้"} />
        <DashboardCard count={1724} type={"ขึ้นงานทั้งหมดเดือนนี้"} />
      </div>
      <Divider />
      <div className="flex justify-between items-center">
        <Box flex={1} display="flex" gap={2} alignItems="center">
          <PrimaryButton
            label={"สร้างคำขอ"}
            variant="primary"
            icon="mdi:plus"
            onClick={() => setIsDetailModalOpen(!isDetailModalOpen)}
          />
          <PrimaryButton
            label={"ฉบับร่าง"}
            variant="secondary"
            onClick={() => {}}
          />
        </Box>
        <Searchbar />
      </div>
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
                  />
                </TableCell>
                <TableCell>หัวข้อ</TableCell>
                <TableCell>บริษัท</TableCell>
                <TableCell>วัตถุดิบ</TableCell>
                <TableCell>กำหนดส่ง</TableCell>
                <TableCell>ผู้ดูแล</TableCell>
                <TableCell>สถานะ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingTasks.map((row) => (
                <TableRow
                  onClick={() => handleTaskDetail(row._id as string)}
                  key={row._id}
                  selected={selectedPending.includes(row._id || "")}
                  className="cursor-pointer hover:bg-blue-400/10 duration-300 transition-all"
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedPending.includes(row._id || "")}
                      onChange={() => handleSelectRow(row._id || "", "pending")}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p>{row.titleName}</p>
                      {renderStatusBadge(row.taskType)}
                    </div>
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>{row.material}</TableCell>
                  <TableCell>
                    {/* {formatThaiDate(row.dueDate.toLocaleString())} */}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          row.sale?.profilePic
                            ? `${import.meta.env.VITE_BASE_URL}/api/${
                                row.sale.profilePic
                              }`
                            : "/default.png" // เผื่อไม่มี profilePic
                        }
                        alt={row.sale?.name || "ไม่ระบุ"}
                        className="rounded-full w-6 h-6 object-cover"
                      />
                      {row.sale?.name || "ไม่ระบุ"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-[#FFF4E5] text-[#FF8C00] rounded-full text-sm">
                      รอรอการอนุมัติ
                    </span>
                  </TableCell>
                </TableRow>
              ))}
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
                    checked={selectedInLine.length === inLine.length}
                    indeterminate={
                      selectedInLine.length > 0 &&
                      selectedInLine.length < inLine.length
                    }
                    onChange={(e) =>
                      handleSelectAll(inLine, "inline", e.target.checked)
                    }
                  />
                </TableCell>
                <TableCell>หัวข้อ</TableCell>
                <TableCell>บริษัท</TableCell>
                <TableCell>วัตถุดิบ</TableCell>
                <TableCell>กำหนดส่ง</TableCell>
                <TableCell>ผู้ดูแล</TableCell>
                <TableCell>สถานะ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inLineTasks.map((row: any) => (
                <TableRow
                  onClick={() => handleTaskDetail(row._id as string)}
                  key={row._id}
                  selected={selectedInLine.includes(row._id || "")}
                  className="cursor-pointer hover:bg-blue-400/10 duration-300 transition-all"
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedInLine.includes(row._id || "")}
                      // onChange={() => handleSelectRow(row.id, "inline")}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p>{row.titleName}</p>
                      {renderStatusBadge(
                        Array.isArray(row.taskType)
                          ? row.taskType
                          : [row.taskType]
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>{row.material}</TableCell>
                  <TableCell>
                    {/* {formatThaiDate(row.dueDate.toLocaleString())} */}
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
                      {row.sale?.name || "ไม่ระบุ"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-[#abffbc] text-[#147800] rounded-full text-sm">
                      อนุมัติขึ้นงานแล้ว
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
      {/* Detail Modal */}
      {isDetailModalOpen && (
        <DetailModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
      <TaskDetail
        open={isTaskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        taskId={selectedTaskId}
      />
    </div>
  );
};

export default HomePage;
