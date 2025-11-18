import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PDFPrintModalProps {
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const PDFPrintModal: React.FC<PDFPrintModalProps> = ({
  fileUrl,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fileUrl);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // โหลด PDF
  useEffect(() => {
    if (!isOpen) return;

    if (isImage) {
      setPdfDoc(null);
      setPageNum(1);
      setRotation(0);
      setThumbnails([fileUrl]);
      return;
    }

    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setPageNum(1); // Reset page
    };
    loadPdf();
  }, [fileUrl, isOpen]);
  useEffect(() => {
    if (!isImage || !canvasRef.current) return;

    const img = new Image();
    img.src = fileUrl;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Adjust canvas size to image
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      context.clearRect(0, 0, canvas.width, canvas.height);

      // Translate and rotate if needed
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.drawImage(
        img,
        (-img.width * scale) / 2,
        (-img.height * scale) / 2,
        img.width * scale,
        img.height * scale
      );
      context.restore();
    };
  }, [fileUrl, isOpen, scale, rotation, isImage]);
  // Render thumbnails
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

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    const renderPage = async () => {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d");
      if (!context) return;

      let viewport = page.getViewport({ scale });
      let width = viewport.width;
      let height = viewport.height;

      if (rotation === 90 || rotation === 270)
        [width, height] = [height, width];

      canvas.width = width;
      canvas.height = height;

      context.save();
      context.translate(width / 2, height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.translate(-viewport.width / 2, -viewport.height / 2);
      await page.render({ canvasContext: context, viewport }).promise;
      context.restore();
    };
    renderPage();
  }, [pdfDoc, pageNum, scale, rotation]);
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
    const walkX = x - startX;
    const walkY = y - startY;
    canvasContainerRef.current.scrollLeft = scrollLeft - walkX;
    canvasContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50">
      <div className="bg-gray-200 rounded-lg w-[90%] h-[90%] flex flex-col p-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          <Icon icon="mdi:close" width={20} height={20} />
        </button>

        {/* Top Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setScale((prev) => prev + 0.25)}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            <Icon icon="mynaui:plus-solid" width={20} height={20} />
          </button>
          <span className="w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.25))}
            className="px-3 py-1 rounded hover:bg-gray-100"
          >
            <Icon icon="ic:round-minus" width={20} height={20} />
          </button>
          <button onClick={() => setRotation((prev) => (prev + 90) % 360)}>
            <Icon icon="mdi:rotate-right" width={20} height={20} />
          </button>
          <button onClick={() => setRotation((prev) => (prev + 270) % 360)}>
            <Icon icon="mdi:rotate-left" width={20} height={20} />
          </button>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
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
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPrintModal;
