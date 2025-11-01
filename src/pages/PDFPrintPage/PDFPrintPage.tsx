import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JsBarcode from "jsbarcode";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PDFPrintModalProps {
  taskID?: string | undefined;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Stamp {
  text: string;
  fontSize: number;
  x: number;
  y: number;
}

const PDFPrintModal: React.FC<PDFPrintModalProps> = ({
  fileUrl,
  isOpen,
  taskID,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [stamps, setStamps] = useState<Record<number, Stamp[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [material, setMaterial] = useState("");
  const [stampText, setStampText] = useState("");
  const [fontSize, setFontSize] = useState(15);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [materials, setMaterials] = useState<Record<number, string>>({});
  const magnifierRef = useRef<HTMLCanvasElement>(null);

  // Load PDF
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

  // Render Thumbnails
  useEffect(() => {
    if (!pdfDoc) return;
    const renderThumbnails = async () => {
      const thumbs: string[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
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

  // Render PDF Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let viewport = page.getViewport({ scale });
      let width = viewport.width;
      let height = viewport.height;
      if (rotation === 90 || rotation === 270)
        [width, height] = [height, width];

      canvas.width = width;
      canvas.height = height;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-viewport.width / 2, -viewport.height / 2);

      // Cancel previous render
      if (renderTaskRef.current) renderTaskRef.current.cancel();
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });

      try {
        await renderTaskRef.current.promise;
      } catch (err) {
        if ((err as any).name !== "RenderingCancelledException")
          console.error(err);
      }

      // Add Stamps
      const pageStamps = stamps[pageNum] || [];
      pageStamps.forEach((stamp) => {
        if (!stamp.text) return;

        // สร้าง Barcode
        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, stamp.text, {
          format: "CODE128",
          displayValue: false,
          height: 35,
          width: 0.6,
          margin: 0,
        });

        ctx.textAlign = "center";
        ctx.fillStyle = "black";

        const barcodeY = stamp.y - 50;
        const textY = stamp.y;
        const materialY = barcodeY - 10;

        // วาด material
        ctx.font = `12px Arial`;
        const pageMaterial = materials[pageNum] || "";
        ctx.fillText(pageMaterial, stamp.x, materialY);

        // วาด barcode
        ctx.drawImage(
          barcodeCanvas,
          stamp.x - barcodeCanvas.width / 2,
          barcodeY,
          barcodeCanvas.width,
          barcodeCanvas.height
        );

        // วาด TaskID
        ctx.font = `${stamp.fontSize}px Arial`;
        ctx.fillText(stamp.text, stamp.x, textY);
      });

      ctx.restore();
    };

    renderPage();
  }, [pdfDoc, pageNum, scale, rotation, material, stamps]);

  // Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - canvasContainerRef.current.offsetLeft);
    setStartY(e.pageY - canvasContainerRef.current.offsetTop);
    setScrollLeft(canvasContainerRef.current.scrollLeft);
    setScrollTop(canvasContainerRef.current.scrollTop);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - canvasContainerRef.current.offsetLeft;
    const y = e.pageY - canvasContainerRef.current.offsetTop;
    canvasContainerRef.current.scrollLeft = scrollLeft - (x - startX);
    canvasContainerRef.current.scrollTop = scrollTop - (y - startY);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Stamp click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosX(x);
    setPosY(y);

    setStamps((prev) => {
      const pageStamps = prev[pageNum] || [];

      // ✅ ถ้ามี stamp ที่ text เดียวกันอยู่ในหน้านี้แล้ว → ย้ายตำแหน่งแทน
      const existingIndex = pageStamps.findIndex((s) => s.text === stampText);

      let newPageStamps;
      if (existingIndex !== -1) {
        // อัปเดตตำแหน่ง stamp เดิม
        newPageStamps = [...pageStamps];
        newPageStamps[existingIndex] = {
          ...newPageStamps[existingIndex],
          x,
          y,
        };
      } else {
        // ตรวจว่า stampText นี้เคยอยู่หน้าอื่นหรือยัง
        const alreadyExists = Object.entries(prev).some(
          ([page, stamps]) =>
            Number(page) !== pageNum && stamps.some((s) => s.text === stampText)
        );

        if (alreadyExists) {
          alert(`รหัสการผลิต ${stampText} ถูกใช้ไปแล้วบนหน้าอื่น`);
          return prev;
        }

        // ถ้ายังไม่มี → เพิ่มใหม่
        newPageStamps = [...pageStamps, { text: stampText, fontSize, x, y }];
      }

      return {
        ...prev,
        [pageNum]: newPageStamps,
      };
    });
  };

  // Magnifier
  const handleMagnifierMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !magnifierRef.current || !isMagnifying) return;

    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;
    const ctx = magnifier.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const zoom = 2;
    const lensSize = magnifier.width / zoom;
    ctx.clearRect(0, 0, magnifier.width, magnifier.height);
    ctx.drawImage(
      canvas,
      x - lensSize / 2,
      y - lensSize / 2,
      lensSize,
      lensSize,
      0,
      0,
      magnifier.width,
      magnifier.height
    );

    ctx.beginPath();
    ctx.arc(
      magnifier.width / 2,
      magnifier.height / 2,
      magnifier.width / 2 - 1,
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 2;
    ctx.stroke();

    magnifier.style.display = "block";
    magnifier.style.position = "fixed";
    magnifier.style.left = `${e.clientX - magnifier.width / 2}px`;
    magnifier.style.top = `${e.clientY - magnifier.height / 2}px`;
  };

  // PDF Download
  const handleDownloadAllStampedPages = async () => {
    if (!pdfDoc) return;
    const pdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
    const originalPdf = await PDFDocument.load(pdfBytes);

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const pageStamps = stamps[i];
      if (!pageStamps || pageStamps.length === 0) continue;

      for (const stamp of pageStamps) {
        if (!stamp.text) continue;
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(originalPdf, [i - 1]);
        newPdf.addPage(copiedPage);
        const page = newPdf.getPage(0);

        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        page.drawText(stamp.text, {
          x: stamp.x,
          y: page.getHeight() - stamp.y,
          size: stamp.fontSize,
          font,
          color: rgb(0, 0, 0),
        });

        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, stamp.text, {
          format: "CODE128",
          displayValue: false,
          height: 40,
          width: 0.6,
          margin: 0,
        });
        const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
        const barcodeBytes = await fetch(barcodeDataUrl).then((r) =>
          r.arrayBuffer()
        );
        const barcodeImg = await newPdf.embedPng(barcodeBytes);
        const barcodeDims = barcodeImg.scale(1);
        page.drawImage(barcodeImg, {
          x: stamp.x,
          y: page.getHeight() - stamp.y + 20,
          width: barcodeDims.width,
          height: barcodeDims.height,
        });

        const stampedBytes = await newPdf.save();
        const blob = new Blob([Uint8Array.from(stampedBytes)], {
          type: "application/pdf",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${stamp.text}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }

    alert("✅ Exported all stamped pages successfully!");
  };

  // Stamp Text Setup
  useEffect(() => {
    if (isOpen && taskID) setStampText(`${taskID}`);
  }, [isOpen, taskID]);

  const handleMaterialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setMaterials((prev) => ({
      ...prev,
      [pageNum]: value === "all" ? "" : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[90%] h-[90%] flex overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 p-2 rounded-full hover:bg-gray-300 z-50"
        >
          <Icon icon="mdi:close" width={20} height={20} />
        </button>

        {/* Sidebar */}
        <div className="w-64 bg-gray-100 p-4 flex flex-col gap-3 overflow-auto">
          <h3 className="font-semibold text-lg mb-2">Stamp Info</h3>
          <label className="text-sm">Text:</label>
          <input
            type="text"
            className="w-full p-1 rounded border"
            value={stampText}
            onChange={(e) => setStampText(e.target.value)}
          />

          <label className="text-sm">Material</label>
          <select
            className="border p-1 rounded-sm"
            onChange={handleMaterialChange}
          >
            <option value="all">กรุณาเลือก Material</option>
            <option value="SKS3">SKS3</option>
            <option value="SKD11">SKD11</option>
            <option value="SGT">SGT</option>
            <option value="SLD">SLD</option>
            <option value="S45C">S45C</option>
            <option value="S50C">S50C</option>
            <option value="AL">AL</option>
            <option value="MC-NYLON">MC-NYLON</option>
          </select>

          <div className="flex justify-between mt-2">
            <button
              className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
              onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
            >
              Zoom In
            </button>
            <button
              className="bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}
            >
              Zoom Out
            </button>
          </div>

          <button
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            onClick={handleDownloadAllStampedPages}
          >
            Download PDF
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
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center bg-white rounded overflow-auto p-4 cursor-grab relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMagnifierMove}
            onMouseEnter={() => setIsMagnifying(true)}
            onMouseLeave={() => setIsMagnifying(false)}
          />

          <canvas
            ref={magnifierRef}
            width={150}
            height={150}
            className="absolute border border-gray-400 rounded-full pointer-events-none bg-white/80 hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default PDFPrintModal;
