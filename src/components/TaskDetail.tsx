import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { useSpring, animated } from "@react-spring/web";

import { Icon } from "@iconify/react";

import Button from "@mui/material/Button";
import { renderStatusBadge } from "./StatusBadge";
import { useEffect, useState } from "react";

import axiosInstance from "../contexts/axiosInstance";
import type { Task } from "../types/task";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import PdfThumbnail from "./PDFThumbnail";
import PDFThumbnail from "./PDFThumbnail";

interface FadeProps {
  children: React.ReactElement<any>;
  in?: boolean;
  onEnter?: (node: HTMLElement, isAppearing: boolean) => void;
  onExited?: (node: HTMLElement, isAppearing: boolean) => void;
}

const Fade = React.forwardRef<HTMLDivElement, FadeProps>(function Fade(
  props,
  ref
) {
  const { children, in: open, onEnter, onExited, ...other } = props;
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 1 : 0 },
    onStart: () => {
      if (open && onEnter) onEnter(null as any, true);
    },
    onRest: () => {
      if (!open && onExited) onExited(null as any, true);
    },
  });

  return (
    <animated.div ref={ref} style={style} {...other}>
      {children}
    </animated.div>
  );
});

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 850,
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 4,
};

interface TaskDetailProp {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  taskId: string | null;
}

export default function TaskDetail({ open, onClose, taskId }: TaskDetailProp) {
  const [taskData, setTaskData] = useState<Task>();
  const [tab, setTab] = useState(0);
  const baseUrl = import.meta.env.VITE_BASE_URL;
  useEffect(() => {
    if (taskId) {
      const fetchTask = async () => {
        try {
          const res = await axiosInstance.get(`/task/getTaskById/${taskId}`);
          setTaskData(res.data);
        } catch (err) {
          console.error("Error fetching task:", err);
        }
      };
      fetchTask();
    }
  }, [taskId]);

  return (
    <Modal
      aria-labelledby="spring-modal-title"
      aria-describedby="spring-modal-description"
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { TransitionComponent: Fade } }}
    >
      <Fade in={open}>
        <Box sx={style}>
          {/* Header */}
          <Box className="flex justify-between items-center mb-3">
            <Typography variant="h6" fontWeight="bold">
              รายละเอียดการขึ้นงาน
            </Typography>
            <Icon
              icon={"mdi:close"}
              width={28}
              className="cursor-pointer text-gray-500 hover:text-gray-700"
              onClick={onClose}
            />
          </Box>
          <Divider className="mb-4" />

          {/* Status Badge */}
          <Box className="mb-3">{renderStatusBadge([])}</Box>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {taskData?.titleName}
          </Typography>

          {/* PO / QT Section */}
          <Box className="bg-gray-50 rounded-lg p-3 mb-3">
            <Typography variant="body2">
              PO: {taskData?.poNumber || "ไม่ได้ระบุ"}
            </Typography>
            <Typography variant="body2">
              QT: {taskData?.qtNumber || "-"}
            </Typography>
          </Box>

          {/* Quantity Section */}
          <Box className="bg-gray-50 rounded-lg p-3 mb-3">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              จำนวนสินค้า
            </Typography>
            <Typography variant="body2">
              {taskData?.quantity} รายการ / รายการละ {taskData?.productUnit}{" "}
              ชิ้น
            </Typography>
          </Box>

          {/* Attachments */}
          <Box className="bg-gray-50 rounded-lg p-3 mb-4">
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              รายระเอียดเพิ่มเติม
            </Typography>
            {taskData?.attachments?.length ? (
              <ul className="list-disc ml-5">
                {taskData.attachments.map((file, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-blue-600 cursor-pointer hover:underline"
                  ></li>
                ))}
              </ul>
            ) : (
              <Typography variant="body2" color="text.secondary">
                ไม่มีรายระเอียดเพิ่มเติม
              </Typography>
            )}
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            indicatorColor="primary"
            className="mt-4"
            centered
          >
            <Tab label={`ไฟล์แนบ (${taskData?.attachments?.length || 0})`} />
            <Tab label="ฝ่ายขายที่ดูแล" />
          </Tabs>

          {/* Tab Panel: รายละเอียดเพิ่มเติม */}
          {tab === 0 && (
            <Box className="mt-3">
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                ไฟล์แนบ
              </Typography>

              <div>
                {/* Implement PDF.js Thumbnail here*/}

                <PDFThumbnail
                  filename="Ring Gauge"
                  fileUrl="/TestThumbnail.pdf"
                  width={120}
                />
              </div>
            </Box>
          )}

          {tab === 1 && (
            <Box className="mt-3">
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                ฝ่ายขายที่ดูแล
              </Typography>
              {taskData?.sale ? (
                <div className="flex items-center  bg-white rounded-lg w-full p-4 gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={`${baseUrl}/api/${taskData.sale.profilePic}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1">
                    <Typography variant="body2" color="text.secondary">
                      <span className="font-semibold text-gray-700">
                        ชื่อ:{" "}
                      </span>
                      {taskData.sale.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <span className="font-semibold text-gray-700">
                        ตำแหน่ง:{" "}
                      </span>
                      {taskData.sale.role || "ไม่ระบุ"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <span className="font-semibold text-gray-700">
                        เบอร์ติดต่อ:{" "}
                      </span>
                      {taskData.sale.phoneNumber || "-"}
                    </Typography>
                  </div>
                </div>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ไม่พบข้อมูลฝ่ายขาย
                </Typography>
              )}
            </Box>
          )}

          {/* Footer Buttons */}
          <Box className="flex justify-end gap-2">
            <Button variant="outlined">บันทึกฉบับร่าง</Button>
            <Button variant="contained" color="primary">
              ยืนยันการผลิต
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
