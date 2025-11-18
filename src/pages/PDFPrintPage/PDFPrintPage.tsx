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
  drawingInfo: { customer, poNumber, qtNumber },
  isOpen,
  taskID,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [headTaskId, setHeadTaskId] = useState(taskID || "");
  const [pageData, setPageData] = useState<
    Record<number, { taskId: string; material: string }>
  >({});

  // ✅ เพิ่ม state สำหรับซูมและหมุน
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // degree (0, 90, 180, 270)

  const currentPageData = pageData[pageNum] || { taskId: "", material: "" };

  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);

  // โหลด PDF
  useEffect(() => {
    if (!isOpen) return;
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageNum(1);
      setZoom(1);
      setRotation(0);
    };
    loadPdf();
  }, [fileUrl, isOpen]);

  // เปลี่ยนค่า task id ต่อหน้า
  const handleTaskIdChange = async (value: string) => {
    const newData = {
      ...pageData,
      [pageNum]: {
        taskId: value,
        material: pageData[pageNum]?.material || "",
      },
    };
    setPageData(newData);

    const fullTaskId = headTaskId
      ? `${headTaskId}${value ? "-" + value : ""}`
      : value;

    if (fullTaskId && !qrCache[fullTaskId]) {
      const qrUrl = await QRCode.toDataURL(fullTaskId, { width: 100 });
      setQrCache((prev) => ({ ...prev, [fullTaskId]: qrUrl }));
    }
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

  useEffect(() => {
    if (!isOpen) return;

    if (isImage) {
      setPdfDoc(null);
      setPageNum(1);
      setZoom(1);
      setRotation(0);
      setThumbnails([fileUrl]);
      return;
    }

    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageNum(1);
      setZoom(1);
      setRotation(0);
    };
    loadPdf();
  }, [fileUrl, isOpen]);
  // แสดงหน้าปัจจุบัน (ซูม + หมุน)
  useEffect(() => {
    if (!isOpen) return;

    if (isImage && canvasRef.current) {
      const img = new Image();
      img.src = fileUrl;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        const w = img.width * zoom;
        const h = img.height * zoom;

        canvas.width = rotation % 180 === 0 ? w : h;
        canvas.height = rotation % 180 === 0 ? h : w;

        ctx!.clearRect(0, 0, canvas.width, canvas.height);

        // Center rotation
        ctx!.translate(canvas.width / 2, canvas.height / 2);
        ctx!.rotate((rotation * Math.PI) / 180);
        ctx!.drawImage(img, -w / 2, -h / 2, w, h);
      };
    }
  }, [fileUrl, zoom, rotation, isImage]);
  // แสดงหน้า PDF (ซูม + หมุน)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pdfDoc || !canvas) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom, rotation });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;
    };

    renderPage();
  }, [pdfDoc, pageNum, zoom, rotation]);

  const generateStampedPdfs = async () => {
    if (!pdfDoc) return [];
    if (isImage) {
      const imgBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
      const pdf = await PDFDocument.create();

      const image = fileUrl.toLowerCase().endsWith("png")
        ? await pdf.embedPng(imgBytes)
        : await pdf.embedJpg(imgBytes);

      const page = pdf.addPage([image.width, image.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });

      // get info from first page data
      const data = pageData[1] || { taskId: "", material: "" };

      const fullTaskId = headTaskId
        ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
        : data.taskId;

      // draw QR
      const qrDataUrl =
        qrCache[fullTaskId] ||
        (await QRCode.toDataURL(fullTaskId, { width: 100 }));

      const qrImage = await pdf.embedPng(qrDataUrl);

      page.drawRectangle({
        x: 5,
        y: image.height - 100,
        width: 75,
        height: 75,
        color: rgb(1, 1, 1),
      });

      page.drawImage(qrImage, {
        x: 10,
        y: image.height - 70,
        width: 70,
        height: 70,
      });

      page.drawText(fullTaskId, {
        x: 18,
        y: image.height - 80,
        size: 10,
      });

      if (data.material) {
        page.drawText(`Material: ${data.material}`, {
          x: 18,
          y: image.height - 95,
          size: 10,
        });
      }

      const bytes = await pdf.save();
      return [
        {
          name: `${fullTaskId}.pdf`,
          blob: new Blob([bytes as unknown as BlobPart], {
            type: "application/pdf",
          }),
        },
      ];
    }
    const totalPages = pdfDoc.numPages;
    const result = Array.from({ length: totalPages }, (_, i) => {
      const page = i + 1;
      const data = pageData[page] || { taskId: "", material: "" };
      const fullTaskId = headTaskId
        ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
        : data.taskId;
      return { page, fullTaskId, material: data.material };
    });

    const usedIds = new Set<string>();
    const duplicates: string[] = [];
    result.forEach((r) => {
      if (!r.fullTaskId) return;
      if (usedIds.has(r.fullTaskId)) duplicates.push(r.fullTaskId);
      else usedIds.add(r.fullTaskId);
    });
    if (duplicates.length > 0) {
      alert(`❌ พบ Task ID ซ้ำ: ${duplicates.join(", ")}`);
      return [];
    }

    const response = await fetch(fileUrl);
    const existingPdfBytes = await response.arrayBuffer();
    const basePdf = await PDFDocument.load(existingPdfBytes);

    const files: { name: string; blob: Blob }[] = [];

    for (const r of result) {
      if (!r.fullTaskId) continue;

      const singlePdf = await PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(basePdf, [r.page - 1]);
      singlePdf.addPage(copiedPage);

      const qrDataUrl =
        qrCache[r.fullTaskId] ||
        (await QRCode.toDataURL(r.fullTaskId, { width: 100 }));
      const qrImage = await singlePdf.embedPng(qrDataUrl);
      const page = singlePdf.getPage(0);
      const { height } = page.getSize();

      page.drawRectangle({
        x: 5,
        y: height - 100,
        width: 75,
        height: 75,
        color: rgb(1, 1, 1),
      });

      page.drawImage(qrImage, {
        x: 10,
        y: height - 70,
        width: 70,
        height: 70,
      });
      page.drawText(`${r.fullTaskId}`, { x: 18, y: height - 80, size: 10 });
      if (r.material) {
        page.drawText(`Material: ${r.material}`, {
          x: 18,
          y: height - 90,
          size: 10,
        });
      }

      const bytes = await singlePdf.save();
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: "application/pdf",
      });
      files.push({ name: `${r.fullTaskId}.pdf`, blob });
    }

    return files;
  };
  const downloadStampedPdfs = async () => {
    const files = await generateStampedPdfs();
    if (!files.length) return;

    for (const f of files) {
      const url = URL.createObjectURL(f.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.click();
      URL.revokeObjectURL(url);
    }

    alert("Downloaded all stamped PDFs!");
  };
  const uploadStampedPdfs = async () => {
    try {
      const files = await generateStampedPdfs();
      if (!files.length) {
        alert("❌ ไม่มีไฟล์ที่ต้องอัปโหลด");
        return;
      }

      // ✅ เตรียมข้อมูลเพิ่มเติม
      let metaData = [];

      if (isImage) {
        // 🔥 image = มีหน้าเดียวเสมอ
        const data = pageData[1] || { taskId: "", material: "" };
        const fullTaskId = headTaskId
          ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
          : data.taskId;

        metaData = [
          {
            page: 1,
            fileName: files[0].name,
            fullTaskId,
            material: data.material,
          },
        ];
      } else {
        // PDF ปกติ
        metaData = files.map((f, i) => {
          const page = i + 1;
          const data = pageData[page] || { taskId: "", material: "" };

          const fullTaskId = headTaskId
            ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
            : data.taskId;

          return {
            page,
            fileName: f.name,
            fullTaskId,
            material: data.material,
          };
        });
      }

      // ✅ สร้าง FormData
      const formData = new FormData();
      formData.append("poNumber", poNumber ?? "");
      formData.append("qtNumber", qtNumber ?? "");
      formData.append("customer", customer ?? "");

      // ✅ แนบไฟล์ทั้งหมด
      for (const f of files) {
        formData.append("files", f.blob, f.name);
      }

      // ✅ แนบ meta data (Task ID + Material ต่อหน้า)
      formData.append("meta", JSON.stringify(metaData));

      // ✅ ส่งไป backend
      const res = await axiosInstance.post("/api/drawing", formData);

      alert("✅ Upload success (รวม Material แล้ว)!");
      downloadStampedPdfs();
      console.log("📄 Server response:", res.data);
    } catch (err: any) {
      console.error("❌ Upload Error:", err.response?.data || err.message);
      alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[90%] h-[90%] flex overflow-hidden relative">
        {/* ปุ่มปิด */}{" "}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded shadow-md p-2 flex gap-3 z-10">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            >
              -
            </button>
            <span className="text-sm font-medium w-10 text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            >
              +
            </button>
          </div>

          {/* Rotate Controls */}
          <div className="flex gap-2">
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => setRotation((r) => (r + 270) % 360)}
            >
              ⟲
            </button>
            <button
              className="bg-gray-200 px-2 rounded"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              ⟳
            </button>
          </div>
        </div>
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
          <div className="flex gap-1 flex-col">
            <select
              className="border p-1 rounded-sm flex-1"
              value={currentPageData.material.split(" + ")[0] || ""}
              onChange={(e) => {
                const [mat2] = currentPageData.material.split(" + ");
                const newMaterial = e.target.value
                  ? mat2
                    ? `${e.target.value} + ${mat2}`
                    : e.target.value
                  : mat2 || "";
                handleMaterialChange(newMaterial);
              }}
            >
              <option value="">เลือก Material</option>
              <option value="SKS3">SKS3</option>
              <option value="SKD11">SKD11</option>
              <option value="SGT">SGT</option>
              <option value="SLD">SLD</option>
              <option value="S45C">S45C</option>
              <option value="S50C">S50C</option>
              <option value="AL">AL</option>
              <option value="CB">CARBIDE</option>
              <option value="MC-NYLON">MC-NYLON</option>
            </select>

            <select
              className="border p-1 rounded-sm flex-1"
              value={currentPageData.material.split(" + ")[1] || ""}
              onChange={(e) => {
                const [mat1] = currentPageData.material.split(" + ");
                const newMaterial = e.target.value
                  ? mat1
                    ? `${mat1} + ${e.target.value}`
                    : e.target.value
                  : mat1 || "";
                handleMaterialChange(newMaterial);
              }}
            >
              <option value="">เลือก Material</option>
              <option value="SKS3">SKS3</option>
              <option value="SKD11">SKD11</option>
              <option value="SGT">SGT</option>
              <option value="SLD">SLD</option>
              <option value="S45C">S45C</option>
              <option value="S50C">S50C</option>{" "}
              <option value="CB">CARBIDE</option>
              <option value="AL">AL</option>
              <option value="MC-NYLON">MC-NYLON</option>
            </select>
          </div>
          <button
            onClick={uploadStampedPdfs}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded"
          >
            บันทึกข้อมูล
          </button>
        </div>
        {/* Thumbnails */}
        <div className="w-64 bg-white p-2 h-full overflow-auto flex flex-col gap-3">
          <h3 className="font-semibold text-base mb-1">Task Mapping</h3>

          {thumbnails.map((src, i) => {
            const page = i + 1;
            const data = pageData[page] || { taskId: "", material: "" };
            const fullTaskId = headTaskId
              ? `${headTaskId}${data.taskId ? "-" + data.taskId : ""}`
              : data.taskId;

            return (
              <div
                key={page}
                className={`border rounded-lg p-2 flex flex-col gap-1 cursor-pointer ${
                  pageNum === page ? "ring-2 ring-blue-400 bg-blue-50" : ""
                }`}
                onClick={() => setPageNum(page)}
              >
                {/* Thumbnail */}
                <img
                  src={src}
                  alt={`Page ${page}`}
                  className="w-full h-20 object-contain rounded border"
                />

                <div className="text-xs font-medium text-center mt-1 text-gray-600 truncate">
                  {fullTaskId || `Page ${page}`}
                </div>

                {/* Material (Display only) */}
                <div className="text-[11px] text-center text-gray-500">
                  {data.material || "-"}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 bg-white rounded overflow-auto p-4 relative">
          <div className="inline-block min-w-full min-h-full">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFInfoModal;
