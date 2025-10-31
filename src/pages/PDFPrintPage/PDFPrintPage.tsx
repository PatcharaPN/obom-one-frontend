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
  const prefix = taskID ? `${taskID}` : "";
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [stampText, setStampText] = useState("");
  const [fontSize, setFontSize] = useState(15);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);

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

  // Render PDF page + Stamp
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

      // Add Stamp
      const pageStamps = stamps[pageNum] || [];
      pageStamps.forEach((stamp) => {
        if (stamp?.text) {
          // วาด Barcode
          const barcodeCanvas = document.createElement("canvas");
          JsBarcode(barcodeCanvas, stamp.text, {
            format: "CODE128",
            displayValue: false,
            height: 35,
            width: 0.6,
            margin: 0,
          });

          // คำนวณกึ่งกลางข้อความ
          ctx.font = `${stamp.fontSize}px Arial`;
          const textWidth = ctx.measureText(stamp.text).width;

          const centerX = stamp.x - textWidth / 2; // กึ่งกลาง
          const barcodeX = centerX; // กึ่งกลางตรงกับข้อความ
          const barcodeY = stamp.y - 50; // 20px เหนือข้อความ

          // วาด barcode
          ctx.drawImage(
            barcodeCanvas,
            barcodeX,
            barcodeY,
            barcodeCanvas.width,
            barcodeCanvas.height
          );

          // วาดข้อความ
          ctx.fillStyle = "black";
          ctx.fillText(stamp.text, centerX, stamp.y);
        }
      });

      ctx.restore();
    };

    renderPage();
  }, [pdfDoc, pageNum, scale, rotation, stampText, fontSize, posX, posY]);

  // Drag handlers
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

  if (!isOpen) return null;
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosX(x);
    setPosY(y);

    setStamps((prev) => {
      // ตรวจสอบว่ามี text นี้อยู่บนหน้าอื่นหรือไม่
      const alreadyExists = Object.values(prev).some((pageStamps) =>
        pageStamps.some((s) => s.text === stampText)
      );

      if (alreadyExists) {
        alert(`รหัสการผลิต ${stampText} ถูกใช้ไปแล้วบนหน้าอื่น`);
        return prev; // ไม่เพิ่มซ้ำ
      }

      // ถ้าไม่เคยใช้ เพิ่มใหม่บนหน้า current
      const pageStamps = prev[pageNum] || [];
      const newPageStamps = [
        ...pageStamps,
        { text: stampText, fontSize, x, y },
      ];

      return {
        ...prev,
        [pageNum]: newPageStamps,
      };
    });
  };

  // const handleDownloadPDF = async () => {
  //   if (!pdfDoc) return;

  //   const pdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
  //   const pdf = await PDFDocument.load(pdfBytes);

  //   for (let i = 1; i <= pdfDoc.numPages; i++) {
  //     const page = pdf.getPage(i - 1); // pdf-lib ใช้ 0-index
  //     const stamp = stamps[i];
  //     if (!stamp?.text) continue;

  //     const font = await pdf.embedFont(StandardFonts.Helvetica);

  //     // วาดข้อความ
  //     page.drawText(stamp.text, {
  //       x: stamp.x,
  //       y: page.getHeight() - stamp.y, // pdf-lib Y axis ต่างจาก canvas
  //       size: stamp.fontSize,
  //       font,
  //       color: rgb(0, 0, 0),
  //     });

  //     // วาด Barcode (แปลงเป็น PNG)
  //     const barcodeCanvas = document.createElement("canvas");
  //     JsBarcode(barcodeCanvas, stamp.text, {
  //       format: "CODE128",
  //       displayValue: false,
  //       height: 35,
  //       width: 0.6,
  //       margin: 0,
  //     });
  //     const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
  //     const pngImageBytes = await fetch(barcodeDataUrl).then((res) =>
  //       res.arrayBuffer()
  //     );
  //     const pngImage = await pdf.embedPng(pngImageBytes);

  //     const pngDims = pngImage.scale(0.5); // เล็กลง
  //     page.drawImage(pngImage, {
  //       x: stamp.x,
  //       y: page.getHeight() - stamp.y + 20, // เหนือข้อความ
  //       width: pngDims.width,
  //       height: pngDims.height,
  //     });
  //   }
  //   const newPdfBytes = await pdf.save();
  //   const blob = new Blob([Uint8Array.from(newPdfBytes)], {
  //     type: "application/pdf",
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "stamped.pdf";
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };
  const handleDownloadAllStampedPages = async () => {
    if (!pdfDoc) return;

    // โหลด PDF ต้นฉบับ
    const pdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
    const originalPdf = await PDFDocument.load(pdfBytes);

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const pageStamps = stamps[i];
      if (!pageStamps || pageStamps.length === 0) continue; // ข้ามหน้าที่ไม่มี stamp

      for (const stamp of pageStamps) {
        if (!stamp.text) continue; // ข้าม stamp ที่ว่าง

        // สร้าง PDF ใหม่ 1 หน้า
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(originalPdf, [i - 1]);
        newPdf.addPage(copiedPage);
        const page = newPdf.getPage(0);

        const font = await newPdf.embedFont(StandardFonts.Helvetica);

        // วาดข้อความ
        page.drawText(stamp.text, {
          x: stamp.x,
          y: page.getHeight() - stamp.y,
          size: stamp.fontSize,
          font,
          color: rgb(0, 0, 0),
        });

        // วาด Barcode
        const barcodeCanvas = document.createElement("canvas");
        JsBarcode(barcodeCanvas, stamp.text, {
          format: "CODE128",
          displayValue: false,
          height: 35,
          width: 0.6,
          margin: 0,
        });
        const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
        const barcodeBytes = await fetch(barcodeDataUrl).then((r) =>
          r.arrayBuffer()
        );
        const barcodeImg = await newPdf.embedPng(barcodeBytes);
        const barcodeDims = barcodeImg.scale(0.5);
        page.drawImage(barcodeImg, {
          x: stamp.x,
          y: page.getHeight() - stamp.y + 20,
          width: barcodeDims.width,
          height: barcodeDims.height,
        });

        // สร้างไฟล์ PDF แยกสำหรับแต่ละ stamp
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

  useEffect(() => {
    if (isOpen && taskID) {
      setStampText(`${taskID}`);
    }
  }, [isOpen, taskID]);
  const handleStampTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.startsWith(prefix)) {
      setStampText(prefix);
      return;
    }
    setStampText(value);
  };
  const handleStampTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursorPos = (e.target as HTMLInputElement).selectionStart ?? 0;
    if (
      (e.key === "Backspace" && cursorPos <= prefix.length) ||
      (e.key === "Delete" && cursorPos < prefix.length)
    ) {
      e.preventDefault();
    }
  };
  const handleStampTextSelect = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    if (input.selectionStart! < prefix.length) {
      input.setSelectionRange(prefix.length, prefix.length);
    }
  };
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
        <div className="w-64 bg-gray-100 rounded p-4 flex flex-col gap-3 overflow-auto">
          <h3 className="font-semibold text-lg mb-2">Stamp Info</h3>
          <label className="text-sm">Text:</label>
          <input
            type="text"
            className="w-full p-1 rounded border"
            value={stampText}
            onChange={handleStampTextChange}
            onKeyDown={handleStampTextKeyDown}
            onFocus={handleStampTextSelect}
          />
          <label className="text-sm">Font Size:</label>
          <input
            type="number"
            className="w-full p-1 rounded border"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          {/* 
          <label className="text-sm">Position X:</label>
          <input
            type="number"
            className="w-full p-1 rounded border"
            value={posX}
            onChange={(e) => setPosX(Number(e.target.value))}
          />

          <label className="text-sm">Position Y:</label>
          <input
            type="number"
            className="w-full p-1 rounded border"
            value={posY}
            onChange={(e) => setPosY(Number(e.target.value))}
          />

          <button
            className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            onClick={() => setStampText(stampText)}
          >
            Add Stamp
          </button> */}{" "}
          <button
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            onClick={handleDownloadAllStampedPages}
          >
            Download PDF
          </button>
        </div>

        {/* Thumbnails */}
        <div className="w-48 bg-white rounded gap-5 p-2 h-full overflow-auto flex flex-col">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={`cursor-pointer rounded p-1 text-center flex flex-col items-center ${
                pageNum === i + 1 ? "bg-blue-100" : ""
              }`}
              onClick={() => setPageNum(i + 1)}
            >
              <img
                src={src}
                alt={`Page ${i + 1}`}
                className="w-full h-20 mb-1"
              />
              <span className="text-xs">Page {i + 1}</span>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center bg-white rounded overflow-auto p-4 cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <canvas ref={canvasRef} onClick={handleCanvasClick} />
        </div>
      </div>
    </div>
  );
};

export default PDFPrintModal;
