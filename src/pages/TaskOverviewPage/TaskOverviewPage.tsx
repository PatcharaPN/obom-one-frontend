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
import QRCheckModal from "../../components/ChangeStatusModal";

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
    const names = tasks.map((t) => t.name);
    const parentNames = new Set<string>();

    names.forEach((n) => {
      const base = n.split("-").slice(0, -1).join("-");
      if (names.includes(base)) parentNames.add(base);
    });

    return tasks
      .filter((t) => !parentNames.has(t.name))
      .filter((t) => {
        const matchCompany =
          companyFilter === "ALL" ||
          (companyFilter === "J" && t.name.startsWith("J")) ||
          (companyFilter === "S" && t.name.startsWith("S"));

        const matchSearch = t.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        return matchCompany && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "th"));
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

  if (loading) return <p className="p-4 text-lg">Loading...</p>;

  return (
    <div className="grid grid-rows-[120px_auto] h-full">
      {/* ------- HEADER ------- */}
      <div className="p-4 text-2xl md:text-3xl font-semibold">
        รายการงานผลิต
      </div>

      <div className="px-4 pb-4">
        {/* ------- FILTERS ------- */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <h2 className="text-xl md:text-2xl">อนุมัติแล้ว</h2>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
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
              sx={{ width: { xs: "100%", md: 300 } }}
            />
          </div>
        </div>

        {/* ------- TABLE WRAPPER (Mobile scroll) ------- */}
        <div className="overflow-x-auto rounded-md border max-h-[750px]">
          <TableContainer component={Paper}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow className="bg-blue-400/5">
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>รหัสการผลิต</TableCell>
                  <TableCell>บริษัท</TableCell>
                  <TableCell>วัตถุดิบ</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>จัดการ</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredTasks.map((t, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" />
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {t.name}
                    </TableCell>

                    <TableCell>{t.customer}</TableCell>

                    <TableCell>{t.material || "ไม่ระบุ"}</TableCell>

                    <TableCell>
                      <p className="text-amber-600">{t.status}</p>
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {/* ปุ่มปรับเป็นไอคอนล้วนๆเมื่อจอเล็ก */}
                        <button
                          onClick={() => handleOpenModal(t)}
                          className={`border p-1 rounded-lg flex items-center gap-1 text-xs md:text-sm ${
                            t.status === "วาง Process"
                              ? "text-green-600 border-green-500/50"
                              : "text-blue-600 border-blue-500/50"
                          }`}
                        >
                          <Icon
                            icon={
                              t.status === "รอวาง Process"
                                ? "mdi:upload"
                                : "akar-icons:edit"
                            }
                            width="16"
                          />
                          <span className="hidden md:block">
                            {t.status === "รอวาง Process"
                              ? "อัปโหลด Drawing"
                              : "แก้ไข"}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            handlePrintPDF(
                              `${import.meta.env.VITE_BASE_URL}/api${t.pdfPath}`
                            )
                          }
                          className="border border-green-500/50 text-green-600 p-1 rounded-lg flex items-center gap-1 text-xs md:text-sm"
                        >
                          <Icon icon="prime:download" width="16" />
                          <span className="hidden md:block">ดาวน์โหลด</span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      {isModalOpen && (
        <QRCheckModal
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
