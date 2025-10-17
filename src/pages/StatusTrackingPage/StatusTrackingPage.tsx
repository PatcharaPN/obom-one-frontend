import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  Typography,
  IconButton,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { toZonedTime } from "date-fns-tz";
import { useAppDispatch, useAppSelector } from "../../store";
import { fetchAllTask } from "../../features/redux/TaskSlice";
import DashboardCard from "../../components/DashboardCard";
import { formatThaiDate, formatThaiDateTime } from "../../utils/formatThaiDate";
import { Icon } from "@iconify/react";
import SummaryModal from "../../components/SummaryModal";
import SearchBar from "../../components/Searchbar";
import { useNavigate } from "react-router-dom";

const getLocalDayStr = (date: Date) => {
  return toZonedTime(date, "Asia/Bangkok").toLocaleDateString("en-CA");
};

const StatusTrackingPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tasks = useAppSelector((state) => state.task.summaryTasks) || [];

  // --- เพิ่ม state search ---
  const [searchTerm, setSearchTerm] = useState("");

  const [tasksByDay, setTasksByDay] = useState<{ [date: string]: any[] }>({});
  const [openDays, setOpenDays] = useState<{ [date: string]: boolean }>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<any[]>([]);
  const [isSummaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);

  const todayStr = getLocalDayStr(new Date());

  // กรอง tasks ตาม searchTerm
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return tasks;

    const lowerSearch = searchTerm.toLowerCase();
    return tasks.filter((t: any) => {
      // ตรวจ field ที่ต้องการค้นหา
      const title = t.titleName?.toLowerCase() || "";
      const company = t.companyName?.toLowerCase() || "";
      const poNumber = t.poNumber?.toLowerCase() || ""; // สมมติมี field นี้
      const qoNumber = t.qtNumber?.toLowerCase() || ""; // สมมติมี field นี้
      const saleName = t.sale?.name?.toLowerCase() || "";
      const saleSurname = t.sale?.surname?.toLowerCase() || "";

      return (
        title.includes(lowerSearch) ||
        company.includes(lowerSearch) ||
        poNumber.includes(lowerSearch) ||
        qoNumber.includes(lowerSearch) ||
        saleName.includes(lowerSearch) ||
        saleSurname.includes(lowerSearch)
      );
    });
  }, [searchTerm, tasks]);

  // จัดกลุ่ม tasks ตามวัน (ใช้ filteredTasks แทน tasks)
  useEffect(() => {
    const grouped: { [date: string]: any[] } = {};
    filteredTasks.forEach((t) => {
      if (!t.approveDate) return;
      const dayStr = getLocalDayStr(new Date(t.approveDate));
      if (!grouped[dayStr]) grouped[dayStr] = [];
      grouped[dayStr].push(t);
    });

    setTasksByDay(grouped);

    // initial collapse state
    const initialOpen: { [date: string]: boolean } = {};
    Object.keys(grouped).forEach((day) => (initialOpen[day] = false));
    setOpenDays(initialOpen);
  }, [filteredTasks]);

  // Fetch tasks
  useEffect(() => {
    dispatch(fetchAllTask());
  }, [dispatch]);

  // สรุป count
  const todayCount = useMemo(
    () => tasksByDay[todayStr]?.filter((t) => t.isApprove).length || 0,
    [tasksByDay, todayStr]
  );

  const weekCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return Object.entries(tasksByDay).reduce((acc, [day, arr]) => {
      const d = new Date(day);
      if (d >= start && d <= end) {
        return acc + arr.filter((t) => t.isApprove).length;
      }
      return acc;
    }, 0);
  }, [tasksByDay]);

  const monthCount = useMemo(() => {
    const now = new Date();
    return Object.entries(tasksByDay).reduce((acc, [day, arr]) => {
      const d = new Date(day);
      if (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      ) {
        return acc + arr.filter((t) => t.isApprove).length;
      }
      return acc;
    }, 0);
  }, [tasksByDay]);

  // แยก tasks เป็นวันนี้ และ 7 วันที่ผ่านมา
  const todayTasksByDay: { [date: string]: any[] } = {};
  const last7DaysTasksByDay: { [date: string]: any[] } = {};

  Object.entries(tasksByDay).forEach(([day, dayTasks]) => {
    const d = new Date(day);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);

    const approvedTasks = dayTasks.filter((t) => t.isApprove);
    if (approvedTasks.length === 0) return;

    if (day === todayStr) {
      todayTasksByDay[day] = approvedTasks;
    } else if (diffDays <= 7 && diffDays >= 0) {
      last7DaysTasksByDay[day] = approvedTasks;
    }
  });

  const renderTaskTable = (day: string, dayTasks: any[]) => (
    <div key={day} className="flex flex-col gap-2">
      {/* Header */}
      <div
        className="flex justify-between items-center cursor-pointer p-2"
        onClick={() => setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }))}
      >
        <Typography
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderRadius: "0.5rem",
            padding: "10px",
            width: "100%",
            backgroundColor:
              day === todayStr
                ? "rgba(0, 128, 0, 0.1)" // วันนี้
                : "rgba(128, 128, 128, 0.1)", // วันอื่น
            color: day === todayStr ? "green" : "gray",
            fontWeight: "normal",
          }}
        >
          {formatThaiDate(day)} {day === todayStr ? "(วันนี้)" : ""} (
          {dayTasks.length})
          <IconButton size="small">
            {openDays[day] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Typography>
      </div>

      {/* Collapse */}
      <Collapse in={!openDays[day]}>
        <div className="flex justify-end mb-2">
          <button
            className="flex gap-2 items-center cursor-pointer hover:bg-amber-700 transition-all hover:text-white border border-amber-600 rounded-xl p-2 text-sm bg-amber-400/20 text-amber-700"
            onClick={() => {
              setSelectedTask(dayTasks);
              setSelectedDate(day);
              setSummaryModalOpen(true);
            }}
          >
            <Icon icon="pajamas:export" width="16" height="16" /> สรุปงาน
          </button>
        </div>

        {dayTasks.length === 0 ? (
          <Typography className="text-center py-4">ไม่มีงานในวันนี้</Typography>
        ) : (
          <TableContainer component={Paper} className="max-h-[250px]">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>บริษัท</TableCell>
                  <TableCell>รหัสการผลิต</TableCell>
                  {/* <TableCell>วัตถุดิบ</TableCell> */}
                  <TableCell>กำหนดส่ง</TableCell>
                  <TableCell>ผู้ดูแล</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>วัน/เวลา ที่อนุมัติ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dayTasks.map((t) => (
                  <TableRow
                    key={t._id}
                    onClick={() => navigate(`/Task/${t._id}`)}
                  >
                    <TableCell>{t.titleName || "-"}</TableCell>
                    <TableCell>
                      {t.companyName === "J" ? (
                        <p>JIG Gauge (J)</p>
                      ) : t.companyName === "S" ? (
                        <p>Single Gauge (S)</p>
                      ) : (
                        <p>ไม่ระบุ</p>
                      )}
                    </TableCell>
                    {/* <TableCell>
                      {t.tasks?.map((sub: any) => sub.material).join(", ") ??
                        "ไม่มีวัตถุดิบ"}
                    </TableCell> */}
                    <TableCell>
                      {t.dueDate ? formatThaiDate(t.dueDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <img
                          src={
                            t.sale?.profilePic
                              ? `${import.meta.env.VITE_BASE_URL}/api/${
                                  t.sale.profilePic
                                }`
                              : "/default.png"
                          }
                          alt={t.sale?.name ?? "ไม่ระบุ"}
                          className="rounded-full w-6 h-6 object-cover"
                        />
                        {t.sale?.name ?? "-"} {t.sale?.surname ?? "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.isApprove ? (
                        <span className="px-2 py-1 bg-[#abffbc] text-[#147800] rounded-full text-sm">
                          อนุมัติขึ้นงานแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-[#FFF4E5] text-[#FF8C00] rounded-full text-sm">
                          รอการอนุมัติ
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.approveDate ? formatThaiDateTime(t.approveDate) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </div>
  );
  const renderFlatSearchTable = (filteredTasks: any[]) => {
    if (filteredTasks.length === 0) {
      return <Typography className="text-center py-4">ไม่พบข้อมูล</Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>บริษัท</TableCell>
              <TableCell>รหัสการผลิต</TableCell>
              {/* <TableCell>วัตถุดิบ</TableCell> */}
              <TableCell>กำหนดส่ง</TableCell>
              <TableCell>วันที่อนุมัติ</TableCell>
              <TableCell>ผู้ดูแล</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>วัน/เวลา ที่อนุมัติ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map((t) => (
              <TableRow
                key={t._id}
                className="cursor-pointer"
                onClick={() => navigate(`/Task/${t._id}`)}
              >
                <TableCell>{t.titleName || "-"}</TableCell>
                <TableCell>
                  {t.companyName === "J" ? (
                    <p>JIG Gauge (J)</p>
                  ) : t.companyName === "S" ? (
                    <p>Single Gauge (S)</p>
                  ) : (
                    <p>ไม่ระบุ</p>
                  )}
                </TableCell>
                {/* <TableCell>
                  {t.tasks?.map((sub: any) => sub.material).join(", ") ??
                    "ไม่มีวัตถุดิบ"}
                </TableCell> */}
                <TableCell>
                  {t.dueDate ? formatThaiDate(t.dueDate) : "-"}
                </TableCell>
                <TableCell>
                  {t.approveDate ? formatThaiDate(t.approveDate) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 items-center">
                    <img
                      src={
                        t.sale?.profilePic
                          ? `${import.meta.env.VITE_BASE_URL}/api/${
                              t.sale.profilePic
                            }`
                          : "/default.png"
                      }
                      alt={t.sale?.name ?? "ไม่ระบุ"}
                      className="rounded-full w-6 h-6 object-cover"
                    />
                    {t.sale?.name ?? "-"} {t.sale?.surname ?? "-"}
                  </div>
                </TableCell>
                <TableCell>
                  {t.isApprove ? (
                    <span className="px-2 py-1 bg-[#abffbc] text-[#147800] rounded-full text-sm">
                      อนุมัติขึ้นงานแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-[#FFF4E5] text-[#FF8C00] rounded-full text-sm">
                      รอการอนุมัติ
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  {t.approveDate ? formatThaiDateTime(t.approveDate) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <div className="p-4">
      {/* Search Input */}

      {/* Dashboard */}
      {!searchTerm.trim() ? (
        <div className="flex gap-4 overflow-hidden h-fit p-4">
          <DashboardCard
            count={tasks.filter((t: any) => !t.isApprove).length}
            type={"คำขอใหม่รออนุมัติ"}
          />
          <DashboardCard count={todayCount} type={"ขึ้นงานทั้งหมดวันนี้"} />
          <DashboardCard count={weekCount} type={"ขึ้นงานทั้งหมดสัปดาห์นี้"} />
          <DashboardCard count={monthCount} type={"ขึ้นงานทั้งหมดเดือนนี้"} />
        </div>
      ) : (
        <div className="flex gap-4 overflow-hidden h-fit p-4">
          <DashboardCard
            count={filteredTasks.length}
            type={"ผลลัพธ์ที่ค้นพบทั้งหมด"}
          />
          <DashboardCard
            count={filteredTasks.filter((t) => t.isApprove).length}
            type={"ที่อนุมัติแล้ว"}
          />
          <DashboardCard
            count={filteredTasks.filter((t) => !t.isApprove).length}
            type={"ยังไม่อนุมัติ"}
          />
        </div>
      )}

      <div className="flex justify-between items-center px-2 gap-4 overflow-x-auto py-10 text-2xl">
        <p>การขึ้นงาน</p>
      </div>
      <div className="mb-4 max-w-sm p-2">
        <SearchBar
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm("")}
        />
      </div>
      {/* Tasks */}
      <div className="flex flex-col gap-4">
        {searchTerm.trim() ? (
          renderFlatSearchTable(filteredTasks)
        ) : (
          <>
            {Object.entries(todayTasksByDay)
              .sort(
                (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
              )
              .map(([day, dayTasks]) => renderTaskTable(day, dayTasks))}

            <Typography className="text-xl font-semibold mt-4 p-2">
              7 วันที่ผ่านมา
            </Typography>
            {Object.entries(last7DaysTasksByDay)
              .sort(
                (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
              )
              .map(([day, dayTasks]) => renderTaskTable(day, dayTasks))}
          </>
        )}
      </div>

      <SummaryModal
        open={isSummaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        date={selectedDate}
        tasksForDate={selectedTask}
      />
    </div>
  );
};

export default StatusTrackingPage;
