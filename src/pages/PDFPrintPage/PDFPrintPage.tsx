import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PDFPrintPageProps {
  fileUrl: string;
}

const PDFPrintPage: React.FC<PDFPrintPageProps> = ({ fileUrl }) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  useEffect(() => {
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    };
    loadPdf();
  }, [fileUrl]);
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
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // ขนาด canvas ตาม viewport + scale
      let viewport = page.getViewport({ scale });
      let width = viewport.width;
      let height = viewport.height;

      // สลับ width/height ถ้า rotate 90/270
      if (rotation === 90 || rotation === 270) {
        [width, height] = [height, width];
      }
      canvas.width = width;
      canvas.height = height;

      context.save();
      // translate กลาง canvas
      context.translate(width / 2, height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.translate(-viewport.width / 2, -viewport.height / 2);

      // render page
      await page.render({ canvasContext: context, viewport }).promise;
      context.restore();
    };
    renderPage();
  }, [pdfDoc, pageNum, scale, rotation]);

  const handlePrint = async () => {
    if (!pdfDoc) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // A4 ขนาด pixel
    const A4_WIDTH_MM = 210;
    const A4_HEIGHT_MM = 297;
    const DPI = 96;
    const MM_TO_INCH = 0.0393701;
    const a4WidthPx = A4_WIDTH_MM * MM_TO_INCH * DPI;
    const a4HeightPx = A4_HEIGHT_MM * MM_TO_INCH * DPI;

    let html = `<style>
    @page { margin: 0; size: A4; }
    body { margin: 0; padding: 0; }
    .page { 
      width: ${a4WidthPx}px; 
      height: ${a4HeightPx}px; 
      page-break-after: always; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      overflow: hidden;
    }
    img { 
      max-width: 100%; 
      max-height: 100%; 
    }
  </style>`;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });

      const isLandscape = viewport.width > viewport.height;

      const canvas = document.createElement("canvas");
      const canvasWidth = a4WidthPx;
      const canvasHeight = a4HeightPx;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let scale = Math.min(
        canvasWidth / viewport.width,
        canvasHeight / viewport.height
      );

      const renderViewport = page.getViewport({ scale });

      let offsetX = (canvas.width - renderViewport.width) / 2;
      let offsetY = (canvas.height - renderViewport.height) / 2;

      ctx.save();

      if (isLandscape) {
        ctx.translate(canvasWidth / 2, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.translate(-canvasHeight / 2, -canvasWidth / 2);

        scale = Math.min(
          canvasHeight / viewport.width,
          canvasWidth / viewport.height
        );
        const rotatedWidth = viewport.width * scale;
        const rotatedHeight = viewport.height * scale;
        offsetX = (canvasHeight - rotatedWidth) / 2;
        offsetY = (canvasWidth - rotatedHeight) / 2;

        const rotatedViewport = page.getViewport({ scale });
        await page.render({
          canvasContext: ctx,
          viewport: rotatedViewport,
          transform: [1, 0, 0, 1, offsetX, offsetY],
        }).promise;
      } else {
        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          transform: [1, 0, 0, 1, offsetX, offsetY],
        }).promise;
      }

      ctx.restore();

      // Watermark
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "red";
      ctx.font = `${Math.floor(canvas.width / 10)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-30 * Math.PI) / 180);
      ctx.fillText("สำเนา", 0, 0);
      ctx.restore();

      html += `<div class="page"><img src="${canvas.toDataURL()}" /></div>`;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // const handleRotateClockwise = (canvas: HTMLCanvasElement) => {
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   // สร้าง canvas ชั่วคราวเก็บภาพเดิม
  //   const tempCanvas = document.createElement("canvas");
  //   tempCanvas.width = canvas.width;
  //   tempCanvas.height = canvas.height;
  //   const tempCtx = tempCanvas.getContext("2d");
  //   if (!tempCtx) return;

  //   tempCtx.drawImage(canvas, 0, 0);

  //   const newWidth = canvas.height;
  //   const newHeight = canvas.width;
  //   canvas.width = newWidth;
  //   canvas.height = newHeight;

  //   ctx.save();
  //   ctx.translate(newWidth / 2, newHeight / 2);
  //   ctx.rotate((90 * Math.PI) / 180);
  //   ctx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
  //   ctx.drawImage(tempCanvas, 0, 0);
  //   ctx.restore();
  // };

  // const handleRotateCounterClockwise = (canvas: HTMLCanvasElement) => {
  //   const ctx = canvas.getContext("2d");
  //   if (!ctx) return;

  //   // สร้าง canvas ชั่วคราวเก็บภาพเดิม
  //   const tempCanvas = document.createElement("canvas");
  //   tempCanvas.width = canvas.width;
  //   tempCanvas.height = canvas.height;
  //   const tempCtx = tempCanvas.getContext("2d");
  //   if (!tempCtx) return;

  //   tempCtx.drawImage(canvas, 0, 0);

  //   const newWidth = canvas.height;
  //   const newHeight = canvas.width;
  //   canvas.width = newWidth;
  //   canvas.height = newHeight;

  //   ctx.save();
  //   ctx.translate(newWidth / 2, newHeight / 2);
  //   ctx.rotate((-90 * Math.PI) / 180);
  //   ctx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);
  //   ctx.drawImage(tempCanvas, 0, 0);
  //   ctx.restore();
  // };
  return (
    <div className="bg-gray-200 h-fit flex flex-col p-4">
      {/* Top Control Bar */}
      <div className="bg-white p-4 rounded-lg flex items-center gap-4 shadow mb-4">
        <div
          className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-800"
          onClick={() => navigate(-1)}
        >
          <Icon icon="lets-icons:back" width="20" height="20" />
          <span>ย้อนกลับ</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((prev) => prev + 0.25)}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            <Icon icon="mynaui:plus-solid" width="20" height="20" />
          </button>
          <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.25))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            <Icon icon="ic:round-minus" width="20" height="20" />
          </button>{" "}
          <div className="flex gap-2">
            {/* หมุนตามเข็มนาฬิกา */}
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              title="Rotate Clockwise"
              className="w-10 h-10 flex items-center justify-center bg-white border rounded-full shadow hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Icon icon="mdi:rotate-right" width="20" height="20" />
            </button>

            {/* หมุนทวนเข็ม */}
            <button
              onClick={() => setRotation((prev) => (prev + 270) % 360)}
              title="Rotate Counter-Clockwise"
              className="w-10 h-10 flex items-center justify-center bg-white border rounded-full shadow hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Icon icon="mdi:rotate-left" width="20" height="20" />
            </button>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="ml-auto bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Print
        </button>

        <button
          onClick={() => setPageNum((prev) => Math.max(prev - 1, 1))}
          disabled={pageNum === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {pageNum} / {pdfDoc?.numPages || 0}
        </span>
        <button
          onClick={() =>
            setPageNum((prev) =>
              pdfDoc ? Math.min(prev + 1, pdfDoc.numPages) : prev
            )
          }
          disabled={pageNum === pdfDoc?.numPages}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex h-[84vh] gap-4">
        {/* Left Sidebar */}
        <div className="w-48 bg-white border rounded gap-5 p-2 h-full overflow-auto flex flex-col">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className={`cursor-pointer border rounded p-1 text-center flex flex-col items-center ${
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
        <div className="flex-1 flex items-center justify-center bg-white border rounded overflow-auto p-4 min-h-0">
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        {/* Right Sidebar */}
        {/* <div className="w-48 bg-white border rounded p-2 h-full overflow-auto">
          <p className="font-semibold mb-2">Document Info</p>
          <p>Total Pages: {pdfDoc?.numPages || 0}</p>
          <p>Current Zoom: {Math.round(scale * 100)}%</p>
        </div> */}
      </div>
    </div>
  );
};

export default PDFPrintPage;
