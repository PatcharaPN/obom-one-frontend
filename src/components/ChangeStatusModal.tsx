import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { Icon } from "@iconify/react";
import * as pdfjsLib from "pdfjs-dist";
import jsQR from "jsqr"; // ⬅️ IMPORT ไลบรารี jsQR

// กำหนด Worker Source สำหรับ pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  task?: { name: string; pdfPath: string; status: string };
  onSave: (newStatus: string) => void;
}

// ----------------------------------------------------
// 💡 Helper Function: แปลง File (Image) เป็น Image Data สำหรับ jsQR
// ----------------------------------------------------
const fileToImageData = (file: File): Promise<ImageData | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return resolve(null);

        // ตั้งค่าขนาด Canvas ให้เท่ากับรูปภาพ
        canvas.width = img.width;
        canvas.height = img.height;
        // วาดรูปภาพลงใน Canvas
        ctx.drawImage(img, 0, 0);

        // ดึง ImageData ออกมา
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      };
      img.onerror = () => {
        console.error("Error loading image for QR scan.");
        resolve(null);
      };
      // อ่านไฟล์เป็น Data URL
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

// ----------------------------------------------------
// 💡 Helper Function: แปลง File (PDF Page 1) เป็น Image Data สำหรับ jsQR
// ----------------------------------------------------
const pdfPageToImageData = async (file: File): Promise<ImageData | null> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // โหลด PDF Document
    const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer })
      .promise;

    // ตรวจสอบว่ามีหน้า PDF หรือไม่
    if (pdfDocument.numPages === 0) return null;

    // ดึงหน้าแรก
    const page = await pdfDocument.getPage(1);

    // ตั้งค่า Viewport และ Canvas (ใช้ Scale ที่สูงพอสมควรเพื่อความคมชัดในการสแกน)
    const scale = 2.0;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // เรนเดอร์หน้า PDF ลงบน Canvas
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    // ดึง ImageData ออกมา
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
  } catch (error) {
    console.error("Error generating ImageData from PDF:", error);
    return null;
  }
};
const cropImageData = (
  imageData: ImageData,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number
): ImageData => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageData;

  canvas.width = cropW;
  canvas.height = cropH;

  // วาดเฉพาะบางส่วนของรูปลง Canvas ใหม่
  ctx.putImageData(imageData, -cropX, -cropY);

  return ctx.getImageData(0, 0, cropW, cropH);
};
const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  open,
  onClose,
  task,
  onSave,
}) => {
  const [newStatus, setNewStatus] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [qrContent, setQrContent] = useState<string | null>(null); // State สำหรับเก็บข้อมูล QR
  const [isScanning, setIsScanning] = useState(false); // State สำหรับสถานะการสแกน
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [width, setWidth] = useState(390);
  const [height, setHeight] = useState(200);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  // Mock environment variable for demonstration in a single file
  const base_url = "https://example.com";

  const fileUrl = task
    ? `${base_url}/api${task.pdfPath}` // ใช้ base_url แทน import.meta.env.VITE_BASE_URL
    : "";

  useEffect(() => {
    if (task) {
      setNewStatus(task.status || "วาง Process");
    }
    if (!open) {
      setSelectedFile(null);
      setQrContent(null); // รีเซ็ตข้อมูล QR เมื่อปิด Modal
    }
  }, [task, open]);

  const handleSave = () => {
    if (!newStatus) return;
    onSave(newStatus);
    onClose();
  };

  /**
   * 📤 ฟังก์ชันสำหรับอัพโหลด/ตรวจสอบไฟล์ และ สแกน QR Code
   */
  const handleUploadFile = async (file: File) => {
    if (!task) return;

    setSelectedFile(file);
    setQrContent(null);
    setIsScanning(true); // เริ่มสแกน

    let imageData: ImageData | null = null;
    let detectedQRContent: string | null = null;
    let scanAttempted = true;

    try {
      // -------------------------------------------
      // 1. 🔍 เตรียม ImageData จากไฟล์ (รองรับไฟล์รูปภาพและ PDF)
      // -------------------------------------------
      if (file.type.startsWith("image/")) {
        // สำหรับไฟล์รูปภาพ
        imageData = await fileToImageData(file);
      } else if (file.type === "application/pdf") {
        // สำหรับไฟล์ PDF: แปลงหน้าแรกเป็น ImageData
        setQrContent("กำลังโหลดและสแกนหน้าแรกของ PDF...");
        imageData = await pdfPageToImageData(file);
      } else {
        setQrContent("ไฟล์ไม่รองรับการสแกน QR Code (รองรับ Image และ PDF)");
        scanAttempted = false;
      }

      // -------------------------------------------
      // 2. 🔍 สแกน QR Code ด้วย jsQR
      // -------------------------------------------
      if (scanAttempted && imageData) {
        // 🔍 Crop 30% มุมซ้ายบน
        const cropWidth = Math.floor(imageData.width * 0.3);
        const cropHeight = Math.floor(imageData.height * 0.3);

        const cropped = cropImageData(imageData, 0, 0, cropWidth, cropHeight);

        // 🔍 สแกน QR ในโซนที่ตัดมา
        const code = jsQR(cropped.data, cropped.width, cropped.height);

        if (code) {
          // ⭐ ตรวจว่า QR ตรงกับ task.name ไหม
          if (code.data !== task.name) {
            alert("แบบ Drawing ไม่ตรงกับรหัสการผลิตที่ระบุ");
          } else {
            detectedQRContent = code.data;
            setQrContent(code.data);
            console.log("✅ QR in TOP-LEFT:", code.data);
          }
        } else {
          setQrContent("ไม่พบ QR ในไฟล์ที่ระบุ");
        }
      } else if (scanAttempted) {
        setQrContent("ไม่สามารถโหลดไฟล์เพื่อสแกนได้");
      }
    } catch (error) {
      console.error("QR Scanning Error:", error);
      setQrContent("เกิดข้อผิดพลาดในการสแกน");
    }

    setIsScanning(false); // สิ้นสุดการสแกน

    // -------------------------------------------
    // 3. 🚀 อัพโหลดและตรวจสอบไฟล์ (ส่ง QR Content ไปด้วย)
    // -------------------------------------------
    const formData = new FormData();
    formData.append("files", file);
    formData.append("headID", task.name);
    if (detectedQRContent) {
      // เพิ่มข้อมูล QR ที่สแกนได้ส่งไปยัง Server
      formData.append("qrData", detectedQRContent);
    }

    try {
      // **Mock Call to API**
      console.log(
        `ไฟล์: ${file.name}, QR: ${
          detectedQRContent || "None"
        }, ส่งไปตรวจสอบ...`
      );
      // **( uncomment code below for actual API call )**
      /*
      const res = await axiosInstance.post(
          `${base_url}/api/verify-drawing`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
      );
      // alert("ไฟล์ตรงกับ Drawing ดั้งเดิม ✅");
      */
    } catch (err) {
      // console.error("Error verifying file:", err);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    event.target.value = "";
  };

  // ... Effects สำหรับ Resize และ Render PDF (ใช้โค้ดเดิม) ...
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newWidth = entry.contentRect.width;
        // กำหนดความสูงตามอัตราส่วนของ PDF (ประมาณ A4)
        const newHeight = newWidth * 1.3;
        setWidth(newWidth);
        setHeight(newHeight);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const renderPdf = async () => {
      if (!task || !fileUrl) {
        setLoading(false);
        return;
      }
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.4 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        const dpr = window.devicePixelRatio || 1;

        // ตั้งค่า Canvas สำหรับ DPI สูง
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // ปรับ Scale สำหรับ High DPI
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // คำนวณ Scale เพื่อให้พอดีกับ Container
        const scale = Math.min(
          (width * dpr) / viewport.width,
          (height * dpr) / viewport.height
        );
        const scaledViewport = page.getViewport({ scale });

        // คำนวณ Offset สำหรับจัดกึ่งกลาง
        const offsetX = (width * dpr - scaledViewport.width) / 2;
        const offsetY = (height * dpr - scaledViewport.height) / 2;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        await page.render({ canvasContext: ctx, viewport: scaledViewport })
          .promise;
        ctx.restore();
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setLoading(false);
      }
    };
    renderPdf();
  }, [fileUrl, width, height, task]);

  if (!task) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
        อัพโหลด Process Drawing และตรวจสอบ QR
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        {/* Section: Task Info */}
        <div className="mb-4">
          <Typography variant="body2">
            <strong>รหัสงาน:</strong> {task.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            สถานะปัจจุบัน: {task.status}
          </Typography>
        </div>

        {/* Section: QR Scan Result */}
        <div className="p-3 rounded-lg border bg-gray-50 mb-4">
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 1, color: "#1976d2" }}
          >
            ผลการตรวจสอบ QR Code
          </Typography>

          {isScanning ? (
            <div className="flex items-center gap-2">
              <CircularProgress size={18} />
              <Typography variant="body2">กำลังสแกน...</Typography>
            </div>
          ) : selectedFile ? (
            <Typography
              variant="body2"
              sx={{
                wordBreak: "break-all",
                color:
                  qrContent?.includes("ไม่พบ") || qrContent?.includes("ผิดพลาด")
                    ? "error.main"
                    : "success.main",
              }}
            >
              {qrContent || "รอผลลัพธ์การสแกน"}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              กรุณาอัพโหลดไฟล์เพื่อเริ่มสแกน
            </Typography>
          )}
        </div>

        {/* PDF Viewer */}
        <div
          ref={containerRef}
          className="w-full max-h-[420px] overflow-auto rounded-lg bg-gray-100 shadow-inner"
          style={{
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
          {loading && (
            <Typography sx={{ p: 2, opacity: 0.5 }}>
              กำลังโหลด PDF...
            </Typography>
          )}
          {/* <canvas
            ref={canvasRef}
            style={{
              display: "block",
              margin: "auto",
              borderRadius: 8,
              userSelect: "none",
              pointerEvents: "none",
              opacity: loading ? 0.1 : 1,
            }}
          /> */}
        </div>

        {/* File Upload Section */}
        <div className="mt-5 flex flex-col gap-2">
          {/* <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-blue-300 hover:bg-blue-50 rounded-lg h-11 transition-all"
          >
            <Icon icon="uil:camera" width="24" color="#1976d2" />
            <span className="text-blue-700">ถ่ายภาพ</span>
          </button> */}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment" // 👈 เปิดกล้องหลังอัตโนมัติ
            style={{ display: "none" }}
            onChange={handleFileChange} // ใช้ฟังก์ชันเดิมได้เลย
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-blue-300 hover:bg-blue-50 rounded-lg h-11 transition-all"
          >
            <Icon icon="line-md:upload-loop" width="24" color="#1976d2" />
            <span className="text-blue-700">อัพโหลดรูปภาพหรือ PDF</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          ยกเลิก
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={newStatus === task.status}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeStatusModal;
