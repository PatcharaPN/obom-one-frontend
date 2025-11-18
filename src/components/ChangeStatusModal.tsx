import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import * as pdfjsLib from "pdfjs-dist";
import axiosInstance from "../contexts/axiosInstance";

interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  task?: any;
  onSave: (newStatus: string) => void;
}
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  open,
  onClose,
  task,
  onSave,
}) => {
  const [newStatus, setNewStatus] = useState("");
  const [width, setWidth] = useState(390);
  const [height, setHeight] = useState(200);
  const [loading, setLoading] = useState(true);
  const fileUrl = `${import.meta.env.VITE_BASE_URL}/api${task.pdfPath}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (task) {
      setNewStatus(task.status || "วาง Process");
    }
  }, [task]);

  const handleSave = () => {
    if (!newStatus) return;
    onSave(newStatus);
    onClose();
  };
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = newWidth * 1.3; // อัตราส่วนประมาณ A4 แนวตั้ง
        setWidth(newWidth);
        setHeight(newHeight);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);
  useEffect(() => {
    const renderPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.4 });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = Math.min(
          canvas.width / viewport.width,
          canvas.height / viewport.height
        );
        const scaledViewport = page.getViewport({ scale });
        const offsetX = (canvas.width - scaledViewport.width) / 2;
        const offsetY = (canvas.height - scaledViewport.height) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
        }).promise;

        ctx.restore();
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPdf();
  }, [fileUrl, width, height]);
  const handleUploadFile = async (file: File) => {
    if (!task) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", task.name);

    try {
      const res = await axiosInstance.post(
        `${import.meta.env.VITE_BASE_URL}/api/verify-drawing`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("ไฟล์ตรงกับ Drawing ดั้งเดิม ✅");
      console.log(res.data);
    } catch (err: any) {
      alert(
        `ตรวจสอบไฟล์ล้มเหลว : ${err.response?.data?.message || err.message}`
      );
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>อัพโหลด Process Drawing</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>รหัสงาน:</strong> {task.name}
        </Typography>

        {/* <FormControl fullWidth>
          <InputLabel>สถานะ</InputLabel>
          <Select
            value={newStatus}
            label="สถานะ"
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {STATUS_STEPS.map((s) => (
              <MenuItem
                key={s}
                value={s}
                disabled={
                  STATUS_STEPS.indexOf(s) < STATUS_STEPS.indexOf(task.status)
                }
              >
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}
      </DialogContent>{" "}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxHeight: "400px",
          overflow: "auto",
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setScrollStart({
            x: containerRef.current!.scrollLeft,
            y: containerRef.current!.scrollTop,
          });
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          containerRef.current!.scrollLeft = scrollStart.x - dx;
          containerRef.current!.scrollTop = scrollStart.y - dy;
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            margin: "auto",
            borderRadius: 6,
            userSelect: "none",
            pointerEvents: "none", // ป้องกันจับ pdf แล้ว highlight
          }}
        />
      </div>
      <div className="w-full p-2 flex flex-col gap-2">
        {" "}
        <div className="cursor-pointer transition-all border-blue-800/20 hover:bg-blue-600/10 border-2 h-10 rounded-lg flex justify-center gap-2 items-center">
          <Icon icon="uil:camera" color="#008AE4" width="24" height="24" />
          <p className="text-md text-blue-500/100">คลิ๊กเพื่อถ่ายภาพ</p>
        </div>
        <div
          className="cursor-pointer ..."
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <Icon
            icon="line-md:upload-loop"
            width="30"
            height="30"
            color="#008AE4"
          />
          <p className="text-md text-blue-500/100">คลิ๊กเพื่ออัพโหลดไฟล์</p>
        </div>
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) handleUploadFile(e.target.files[0]);
          }}
        />
      </div>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          ยกเลิก
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={newStatus === task.status}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeStatusModal;
