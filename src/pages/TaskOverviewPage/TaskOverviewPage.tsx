import { useEffect, useState, useMemo } from "react";
import type { Task } from "../../types/task";
import { formatThaiDate, formatThaiDateTime } from "../../utils/formatThaiDate";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

const TaskOverviewPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"ALL" | "J" | "S">("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://one.obomgauge.com/api/task/approved");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleCloseTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId
          ? { ...t, isApprove: true, approveDate: new Date().toISOString() }
          : t
      )
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedTasks(checked ? tasks.map((t) => t._id!) : []);
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const renderStatusBadge = (taskTypes: string[]) => {
    return taskTypes.map((type) => (
      <span
        key={type}
        className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs"
      >
        {type}
      </span>
    ));
  };

  // ✅ รวม filter ทั้ง search + company
  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tasks.filter((t) => {
      const matchCompany =
        companyFilter === "ALL" || t.companyName === companyFilter;
      const matchSearch =
        t.titleName?.toLowerCase().includes(term) ||
        t.tasks?.some((sub) => sub.taskID?.toLowerCase().includes(term)) ||
        `${t.sale?.name || ""} ${t.sale?.surname || ""}`
          .toLowerCase()
          .includes(term);

      return matchCompany && matchSearch;
    });
  }, [searchTerm, companyFilter, tasks]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="grid grid-rows-[150px_auto] h-full">
      <div className="p-5 text-3xl">รายการงานผลิต</div>

      <div className="p-5">
        {/* 🔍 Search + Filter bar */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl">อนุมัติแล้ว</h2>

          <div className="flex gap-3 items-center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ชนิดงาน</InputLabel>
              <Select
                value={companyFilter}
                label="บริษัท"
                onChange={(e) =>
                  setCompanyFilter(e.target.value as "ALL" | "J" | "S")
                }
              >
                <MenuItem value="ALL">ทั้งหมด</MenuItem>
                <MenuItem value="J">JIG Gauge (J)</MenuItem>
                <MenuItem value="S">Single Gauge (S)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              variant="outlined"
              placeholder="ค้นหา..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
            />
          </div>
        </div>

        <TableContainer component={Paper} className="max-h-[750px]">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="bg-blue-400/5">
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedTasks.length === filteredTasks.length &&
                      filteredTasks.length > 0
                    }
                    indeterminate={
                      selectedTasks.length > 0 &&
                      selectedTasks.length < filteredTasks.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>หัวข้อ</TableCell>
                <TableCell>ชนิดงาน</TableCell>
                <TableCell>รหัสการผลิต</TableCell>
                <TableCell>กำหนดส่ง</TableCell>
                <TableCell>ผู้ดูแล</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>วัน/เวลาที่อนุมัติ</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTasks.map((row) => {
                const dueDate = row.dueDate ? new Date(row.dueDate) : null;
                const now = new Date();
                const diffDays = dueDate
                  ? (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  : 0;
                const isOverdue = dueDate ? diffDays < 0 : false;
                const isSoon = dueDate ? diffDays <= 2 && diffDays >= 0 : false;

                return (
                  <TableRow
                    key={row._id}
                    selected={selectedTasks.includes(row._id!)}
                    className={`cursor-pointer hover:bg-blue-400/10 duration-300 transition-all ${
                      isOverdue ? "bg-red-100" : isSoon ? "bg-yellow-100" : ""
                    }`}
                    onClick={() => navigate(`/Task/${row._id}`)}
                  >
                    <TableCell
                      padding="checkbox"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedTasks.includes(row._id!)}
                        onChange={() => handleSelectTask(row._id!)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {row.titleName} {renderStatusBadge(row.taskType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.companyName === "J"
                        ? "JIG Gauge (J)"
                        : row.companyName === "S"
                        ? "Single Gauge (S)"
                        : "ไม่ระบุ"}
                    </TableCell>
                    <TableCell>
                      {row.tasks.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="inline-block mr-1">
                          {t.taskID}
                          {idx < Math.min(row.tasks.length, 2) - 1 ? ", " : ""}
                        </span>
                      ))}
                      {row.tasks.length > 2 && <span>...</span>}
                    </TableCell>
                    <TableCell>{formatThaiDate(row.dueDate)}</TableCell>
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
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          row.isApprove
                            ? "bg-[#abffbc] text-[#147800]"
                            : isOverdue
                            ? "bg-red-200 text-red-700"
                            : isSoon
                            ? "bg-yellow-200 text-yellow-700"
                            : "bg-[#FFF4E5] text-[#FF8C00]"
                        }`}
                      >
                        {row.isApprove
                          ? "อนุมัติขึ้นงานแล้ว"
                          : isOverdue
                          ? "หลุด Due"
                          : isSoon
                          ? "ใกล้ Due"
                          : "รออนุมัติ"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatThaiDateTime(row.approveDate || "")}
                    </TableCell>
                    <TableCell>
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTask(row._id!);
                        }}
                      >
                        ปิดงาน
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default TaskOverviewPage;
