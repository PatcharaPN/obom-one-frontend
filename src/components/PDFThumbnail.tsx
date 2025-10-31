import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Icon } from "@iconify/react";
import PDFPrintModal from "../pages/PDFPrintPage/PDFPrintPage";
import ReactDOM from "react-dom";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PdfThumbnailProps {
  fileUrl: string;
  width?: number;
  taskCode?: string;
  height?: number;
  filename: string;
  quantity?: string | number;
  filePath: string;
  material?: string;
  onPrint: (filename: string) => void;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  fileUrl,
  width = 200,
  height = 220,
  filename,
  taskCode,
  material,
  quantity,
  onPrint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinted, setPrinted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const renderPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });

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

  const handlePrint = () => {
    window.open(fileUrl, "_blank");
    setPrinted(true);
    onPrint(fileUrl);
  };
  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl, { mode: "cors" });
      if (!response.ok) {
        console.error(
          "Download failed, status:",
          response.status,
          response.statusText
        );
        return;
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;

      link.target = "_blank";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  return (
    <div
      style={{
        position: "relative",
        width: width + 30,
        // height: height + 120,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        textAlign: "center",
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "scale(1.05)";
        el.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      }}
    >
      {/* PDF Icon overlay */}
      <div className="absolute left-2 top-2">
        <Icon icon="material-icon-theme:pdf" width="32" height="32" />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
          Loading...
        </div>
      )}

      {/* Canvas */}
      <canvas
        onClick={handleOpenModal}
        ref={canvasRef}
        style={{
          borderRadius: 6,
          display: "block",
          marginBottom: 6,
          width: "100%",
          height: height,
          objectFit: "contain",
          backgroundColor: "#f5f5f5",
        }}
      />
      <div className="flex flex-col w-full items-start pl-2">
        {" "}
        {/* หรือเอา items-start ออกก็ได้ */}
        <p
          style={{
            width: "100%",
            margin: 0,
            fontSize: 12,
            fontWeight: "bold",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left", // ✅ ชิดซ้าย
          }}
          title={filename}
        >
          {filename}
        </p>
        <p
          style={{
            width: "100%",
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left", // ✅ ชิดซ้าย
          }}
          title={taskCode}
        >
          {taskCode}
        </p>
        <div className="flex justify-between w-full">
          {" "}
          {material && (
            <div
              style={{
                marginTop: 4,
                padding: "2px 6px",
                fontSize: 10,
                borderRadius: 8,
                backgroundColor: "#e0f2ff",
                color: "#0369a1",
                width: "fit-content",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "left", // ✅ ชิดซ้าย
              }}
              title={material}
            >
              {material}
            </div>
          )}
          <p>{quantity} ชิ้น</p>
        </div>
      </div>

      {/* Filename */}

      {/* Print button */}
      {/* Print & Download buttons */}
      <div
        style={{
          marginTop: "auto",
          width: "100%",
          display: "flex",
          gap: "5px",
          justifyContent: "flex-end",
        }}
      >
        {/* Print Button */}
        <button
          onClick={handlePrint}
          disabled={isPrinted}
          style={{
            marginTop: 8,
            padding: "4px 10px",
            borderRadius: 6,
            backgroundColor: isPrinted ? "#ccc" : "#3b82f6",
            color: "#fff",
            fontSize: 12,
            cursor: isPrinted ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon icon="mingcute:print-line" width={18} height={18} />
          {isPrinted ? "ปริ้นต์แล้ว" : "ปริ้นต์"}
        </button>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          style={{
            marginTop: 8,
            padding: "4px 10px",
            borderRadius: 6,
            backgroundColor: "#10b981", // green
            color: "#fff",
            fontSize: 12,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon icon="mdi:download" width={18} height={18} />
          ดาวน์โหลด
        </button>
      </div>
      <div className="absolute">
        {" "}
        {isModalOpen &&
          ReactDOM.createPortal(
            <PDFPrintModal
              taskID={taskCode}
              fileUrl={fileUrl}
              isOpen={isModalOpen}
              onClose={handleCloseModal}
            />,
            document.body
          )}
      </div>
    </div>
  );
};

export default PdfThumbnail;
