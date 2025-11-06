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

import axiosInstance from "../../contexts/axiosInstance";

const TaskOverviewPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
        console.log(res.data);
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

    // หาว่าตัวไหนมีลูก (Parent)
    names.forEach((n) => {
      const base = n.split("-").slice(0, -1).join("-");
      if (names.includes(base)) {
        parentNames.add(base);
      }
    });

    // ตัด parent ออก
    return tasks
      .filter((t: any) => !parentNames.has(t.name))
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "th"));
  }, [tasks]);

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
                  // checked={
                  //   selectedTasks.length === filteredTasks.length &&
                  //   filteredTasks.length > 0
                  // }
                  // indeterminate={
                  //   selectedTasks.length > 0 &&
                  //   selectedTasks.length < filteredTasks.length
                  // }
                  // onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>รหัสการผลิต</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>จัดการ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTasks.map((t: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{t.name}</TableCell>{" "}
                  <TableCell>
                    {" "}
                    <p className="text-amber-500">{t.status}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
};

export default TaskOverviewPage;
