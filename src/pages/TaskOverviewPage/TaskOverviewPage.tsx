import { useEffect, useState, useMemo } from "react";
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
import { Icon } from "@iconify/react";
import axiosInstance from "../../contexts/axiosInstance";
import ChangeStatusModal from "../../components/ChangeStatusModal";

const TaskOverviewPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<"ALL" | "J" | "S">("ALL");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          "https://one.obomgauge.com/api/api/drawing"
        );
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const names = tasks.map((t: any) => t.name);
    const parentNames = new Set<string>();

    names.forEach((n) => {
      const base = n.split("-").slice(0, -1).join("-");
      if (names.includes(base)) {
        parentNames.add(base);
      }
    });

    return tasks
      .filter((t: any) => !parentNames.has(t.name))
      .filter((t: any) => {
        const matchCompany =
          companyFilter === "ALL" ||
          (companyFilter === "J" && t.name.startsWith("J")) ||
          (companyFilter === "S" && t.name.startsWith("S"));
        const matchSearch = t.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchCompany && matchSearch;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "th"));
  }, [tasks, searchTerm, companyFilter]);

  const handleOpenModal = (task: any) => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleSaveStatus = (newStatus: string) => {
    if (!selectedTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t._id === selectedTask._id ? { ...t, status: newStatus } : t
      )
    );
    setModalOpen(false);
  };

  const handlePrintPDF = (url: string) => {
    const pdf = window.open(url, "_blank");
    pdf?.print();
  };
  if (loading) return <p>Loading...</p>;

  return (
    <div className="grid grid-rows-[150px_auto] h-full">
      <div className="p-5 text-3xl">รายการงานผลิต</div>

      <div className="p-5">
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

        {/* 📋 ตารางแสดงรายการ */}
        <TableContainer component={Paper} className="max-h-[750px]">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="bg-blue-400/5">
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>
                <TableCell>รหัสการผลิต</TableCell>
                <TableCell>บริษัท</TableCell>
                <TableCell>วัตถุดิบ</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการสถานะ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTasks.map((t: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.customer}</TableCell>
                  <TableCell>{t.material ? t.material : "ไม่ระบุ"}</TableCell>
                  <TableCell>
                    <p className="text-amber-500">{t.status}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(t)}
                        className={`hover:bg-blue-600/10 text-blue-500 cursor-pointer border border-blue-500/50 p-1 rounded-lg flex gap-2 items-center ${
                          t.status === "วาง Process"
                            ? "text-green-600 border-green-500/50 hover:bg-green-600/10"
                            : ""
                        }`}
                      >
                        <Icon
                          icon={
                            t.status === "รอวาง Process"
                              ? "mdi:upload"
                              : "akar-icons:edit"
                          }
                          width="15"
                          height="15"
                        />
                        {t.status === "รอวาง Process"
                          ? "อัปโหลด Drawing"
                          : "แก้ไข"}
                      </button>
                      <button
                        onClick={() =>
                          handlePrintPDF(
                            `${import.meta.env.VITE_BASE_URL}/api` + t.pdfPath
                          )
                        }
                        className="hover:bg-green-600/10 text-green-500 cursor-pointer border border-green-500/50 p-1 rounded-lg flex gap-2 items-center"
                      >
                        <Icon icon="prime:download" width="15" height="15" />{" "}
                        ดาวน์โหลด
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {isModalOpen && (
        <ChangeStatusModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveStatus}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default TaskOverviewPage;
