import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import axiosInstance from "../../contexts/axiosInstance";
import { PDFDocument, rgb } from "pdf-lib";
import * as QRCode from "qrcode";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PDFPrintModalProps {
  drawingInfo: { customer?: string; poNumber?: string; qtNumber?: string };
  taskID?: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFInfoModal: React.FC<PDFPrintModalProps> = ({
  fileUrl,
  isOpen,
  taskID,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [headTaskId, setHeadTaskId] = useState(taskID || "");
  const [pageData, setPageData] = useState<
    Record<number, { taskId: string; material: string }>
  >({});

  const currentPageData = pageData[pageNum] || { taskId: "", material: "" };

  // โหลด PDF
  useEffect(() => {
    if (!isOpen) return;
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageNum(1);
    };
    loadPdf();
  }, [fileUrl, isOpen]);

  // เปลี่ยนค่า task id ต่อหน้า
  const handleTaskIdChange = (value: string) => {
    setPageData((prev) => ({
      ...prev,
      [pageNum]: {
        taskId: value,
        material: prev[pageNum]?.material || "",
      },
    }));
  };

  // เปลี่ยนค่า material ต่อหน้า
  const handleMaterialChange = (value: string) => {
    setPageData((prev) => ({
      ...prev,
      [pageNum]: {
        material: value,
        taskId: prev[pageNum]?.taskId || "",
      },
    }));
  };

  // สร้าง thumbnail ทุกหน้า
  useEffect(() => {
    if (!pdfDoc) return;
    const renderThumbnails = async () => {
      const thumbs: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push(canvas.toDataURL("image/png"));
      }
      setThumbnails(thumbs);
    };
    renderThumbnails();
  }, [pdfDoc]);

  // แสดงหน้าปัจจุบัน
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
    };
    renderPage();
  }, [pdfDoc, pageNum]);

  const handleSubmit = async () => {
    try {
      if (!pdfDoc) return;

      const totalPages = pdfDoc.numPages;
      const result = Array.from({ length: totalPages }, (_, i) => {
        const page = i + 1;
        const data = pageData[page] || { taskId: "", material: "" };
        const fullTaskId = headTaskId
          ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
          : data.taskId;
        return { page, fullTaskId, material: data.material };
      });

      // ✅ ตรวจซ้ำ
      const usedIds = new Set<string>();
      const duplicates: string[] = [];
      result.forEach((r) => {
        if (!r.fullTaskId) return;
        if (usedIds.has(r.fullTaskId)) duplicates.push(r.fullTaskId);
        else usedIds.add(r.fullTaskId);
      });
      if (duplicates.length > 0) {
        alert(`❌ พบ Task ID ซ้ำ: ${duplicates.join(", ")}`);
        return;
      }

      // ✅ โหลด PDF ต้นฉบับครั้งเดียว
      const response = await fetch(fileUrl);
      const existingPdfBytes = await response.arrayBuffer();
      const basePdf = await PDFDocument.load(existingPdfBytes);

      const formData = new FormData();
      formData.append("poNumber", "PO-1234");
      formData.append("qtNumber", "QT-5678");
      formData.append("customer", "Honda");

      // ✅ วนหน้าแล้วสร้าง PDF แยก
      for (const r of result) {
        if (!r.fullTaskId) continue;

        const singlePdf = await PDFDocument.create();
        const [copiedPage] = await singlePdf.copyPages(basePdf, [r.page - 1]);
        singlePdf.addPage(copiedPage);

        // วาง QR ซ้ายบน
        const qrDataUrl = await QRCode.toDataURL(r.fullTaskId, { width: 100 });
        const qrImage = await singlePdf.embedPng(qrDataUrl);
        const page = singlePdf.getPage(0);
        const { height } = page.getSize();

        // กล่องพื้นหลังของ QR
        page.drawRectangle({
          x: 15,
          y: height - 130,
          width: 75,
          height: 75,
          color: rgb(1, 1, 1),
        });

        // วาง QR
        page.drawImage(qrImage, {
          x: 20,
          y: height - 120,
          width: 70,
          height: 70,
        });

        // 🟩 เพิ่มพื้นหลังให้ข้อความ Task ID และ Material
        const textBgWidth = 90;
        const textBgHeight = 15;
        const textBgX = 15;
        const textBgY = height - 165; // ใต้กล่อง QR

        page.drawRectangle({
          x: textBgX,
          y: textBgY,
          width: textBgWidth,
          height: textBgHeight,
          color: rgb(1, 1, 1), // สีพื้นหลังข้อความ (ขาว)
          opacity: 1,
        });

        // 🟨 เพิ่มข้อความ Task ID และ Material ใต้ QR
        page.drawText(`${r.fullTaskId}`, {
          x: 20,
          y: height - 165 + 15,
          size: 10,
          color: rgb(0, 0, 0),
        });

        if (r.material) {
          page.drawText(`Material: ${r.material}`, {
            x: 20,
            y: height - 165 + 5,
            size: 10,
            color: rgb(0, 0, 0),
          });
        }
        const singlePdfBytes = await singlePdf.save();
        const blob = new Blob([singlePdfBytes as unknown as BlobPart], {
          type: "application/pdf",
        });

        formData.append("files", blob, `${r.fullTaskId}.pdf`);
        formData.append(
          "meta[]",
          JSON.stringify({ taskID: r.fullTaskId, material: r.material })
        );
      }

      // ✅ ส่งทั้งหมดขึ้น API
      const res = await axiosInstance.post("/api/drawing", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Upload success (split per page)!");
      console.log("📄 Response:", res.data);
    } catch (err: any) {
      console.error("❌ Upload Error:", err);
      alert(`❌ Upload failed: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[90%] h-[90%] flex overflow-hidden relative">
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300 z-50"
        >
          <Icon icon="mdi:close" width={20} height={20} />
        </button>

        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 flex flex-col gap-3 overflow-auto">
          <h3 className="font-semibold text-lg mb-2">ข้อมูล Drawing</h3>

          <label className="text-sm font-medium">รหัสหลัก (Head Task ID)</label>
          <input
            type="text"
            className="w-full p-1 rounded border"
            value={headTaskId}
            onChange={(e) => setHeadTaskId(e.target.value)}
            readOnly
          />

          <label className="text-sm font-medium mt-2">
            รหัสการผลิตหน้านี้ (Task ID)
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              className="w-24 p-1 rounded border bg-gray-100"
              value={headTaskId}
              readOnly
            />
            <span className="self-center">-</span>
            <input
              type="text"
              className="flex-1 p-1 rounded border w-15"
              value={currentPageData.taskId}
              onChange={(e) => handleTaskIdChange(e.target.value)}
              placeholder="เช่น 1, 2"
            />
          </div>

          <label className="text-sm mt-2">Material</label>
          <select
            className="border p-1 rounded-sm"
            value={currentPageData.material}
            onChange={(e) => handleMaterialChange(e.target.value)}
          >
            <option value="">เลือก Material</option>
            <option value="SKS3">SKS3</option>
            <option value="SKD11">SKD11</option>
            <option value="SGT">SGT</option>
            <option value="SLD">SLD</option>
            <option value="S45C">S45C</option>
            <option value="S50C">S50C</option>
            <option value="AL">AL</option>
            <option value="MC-NYLON">MC-NYLON</option>
          </select>

          <button
            onClick={handleSubmit}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded"
          >
            บันทึกข้อมูล
          </button>
        </div>

        {/* Thumbnails */}
        <div className="w-48 bg-white p-2 h-full overflow-auto flex flex-col gap-2">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={`cursor-pointer rounded p-1 flex flex-col items-center ${
                pageNum === i + 1 ? "bg-blue-100" : ""
              }`}
              onClick={() => setPageNum(i + 1)}
            >
              <img
                src={src}
                alt={`Page ${i + 1}`}
                className="w-full h-20 mb-1 object-contain"
              />
              <span className="text-xs">Page {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex items-center justify-center bg-white rounded overflow-auto p-4">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default PDFInfoModal;
