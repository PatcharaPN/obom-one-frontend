import { useEffect, useState } from "react";
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
import Divider from "../../components/Divider";
import { formatThaiDate } from "../../utils/formatThaiDate";
import { renderStatusBadge } from "../../components/StatusBadge";
import { useNavigate } from "react-router-dom";

const getLocalDayStr = (date: Date) => {
  return toZonedTime(date, "Asia/Bangkok").toLocaleDateString("en-CA");
};

const StatusTrackingPage = () => {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.task.summaryTasks);
  const [tasksByDay, setTasksByDay] = useState<{ [date: string]: any[] }>({});
  const [openDays, setOpenDays] = useState<{ [date: string]: boolean }>({});
  const todayStr = getLocalDayStr(new Date()); // ใช้ helper
  const naviagate = useNavigate();
  useEffect(() => {
    if (!tasks) return;
    const grouped: { [date: string]: any[] } = {};

    tasks.forEach((t) => {
      if (!t.approveDate) return;
      const dayStr = getLocalDayStr(new Date(t.approveDate));
      if (!grouped[dayStr]) grouped[dayStr] = [];
      grouped[dayStr].push(t);
    });

    setTasksByDay(grouped);

    const initialOpen: { [date: string]: boolean } = {};
    Object.keys(grouped).forEach((day) => (initialOpen[day] = false));
    setOpenDays(initialOpen);
  }, [tasks]);

  useEffect(() => {
    dispatch(fetchAllTask());
  }, [dispatch]);
  const todayCount = tasksByDay[todayStr]?.filter((t) => t.isApprove).length;

  const weekCount = Object.entries(tasksByDay).reduce((acc, [day, arr]) => {
    const d = new Date(day);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    if (d >= start && d <= end) {
      return acc + arr.filter((t) => t.isApprove).length;
    }
    return acc;
  }, 0);

  const monthCount = Object.entries(tasksByDay).reduce((acc, [day, arr]) => {
    const d = new Date(day);
    const now = new Date();
    if (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    ) {
      return acc + arr.filter((t) => t.isApprove).length;
    }
    return acc;
  }, 0);

  return (
    <div>
      <div className="flex gap-4 overflow-hidden ">
        <DashboardCard
          count={tasks.filter((t) => !t.isApprove).length}
          type={"คำขอใหม่รออนุมัติ"}
        />
        <DashboardCard count={todayCount} type={"ขึ้นงานทั้งหมดวันนี้"} />
        <DashboardCard count={weekCount} type={"ขึ้นงานทั้งหมดสัปดาห์นี้"} />
        <DashboardCard count={monthCount} type={"ขึ้นงานทั้งหมดเดือนนี้"} />
      </div>
      <Divider />
      <div className="flex gap-4 overflow-x-auto py-10 text-2xl">
        การขึ้นงาน
      </div>
      <div className="flex flex-col gap-4">
        {Object.entries(tasksByDay)
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([day, dayTasks]) => {
            const approvedTasks = dayTasks.filter((t) => t.isApprove);
            if (approvedTasks.length === 0) return null;

            return (
              <div key={day} className="flex flex-col gap-2">
                <div
                  className="flex justify-between items-center cursor-pointer bg-gray-100 p-2"
                  onClick={() =>
                    setOpenDays((prev) => ({ ...prev, [day]: !prev[day] }))
                  }
                >
                  <Typography
                    sx={{
                      color: day === todayStr ? "green" : "inherit",
                      fontWeight: day === todayStr ? "normal" : "normal",
                    }}
                  >
                    {formatThaiDate(day)} {day === todayStr ? "(วันนี้)" : ""} (
                    {approvedTasks.length})
                  </Typography>

                  <IconButton size="small">
                    {openDays[day] ? (
                      <KeyboardArrowUp />
                    ) : (
                      <KeyboardArrowDown />
                    )}
                  </IconButton>
                </div>

                <Collapse in={openDays[day]}>
                  <TableContainer component={Paper} className="max-h-[250px]">
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>หัวข้อ</TableCell>
                          <TableCell>บริษัท</TableCell>
                          <TableCell>วัตถุดิบ</TableCell>
                          <TableCell>กำหนดส่ง</TableCell>
                          <TableCell>ผู้ดูแล</TableCell>
                          <TableCell>สถานะ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {approvedTasks.map((t) => (
                          <TableRow
                            key={t._id}
                            className="cursor-pointer"
                            onClick={() => naviagate(`/Task/${t._id}`)}
                          >
                            <TableCell>
                              {" "}
                              <div className="flex items-center gap-2 w-fit">
                                <p>{t.titleName}</p>{" "}
                                {renderStatusBadge(t.taskType)}
                              </div>
                            </TableCell>
                            <TableCell>{t.companyName}</TableCell>
                            <TableCell>
                              {t.tasks
                                ?.map((sub: any) => sub.material)
                                .join(", ") || "-"}
                            </TableCell>
                            <TableCell>{formatThaiDate(t.dueDate)}</TableCell>
                            <TableCell>
                              {" "}
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    t.sale?.profilePic
                                      ? `${import.meta.env.VITE_BASE_URL}/api/${
                                          t.sale.profilePic
                                        }`
                                      : "/default.png"
                                  }
                                  alt={t.sale?.name || "ไม่ระบุ"}
                                  className="rounded-full w-6 h-6 object-cover"
                                />
                                {t.sale?.name || "ไม่ระบุ"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-1 bg-[#abffbc] text-[#147800] rounded-full text-sm">
                                อนุมัติแล้ว
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default StatusTrackingPage;
