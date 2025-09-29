import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PdfThumbnailProps {
  fileUrl: string;
  width?: number;
  height?: number;
  filename: string;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  fileUrl,
  width = 120,
  height = 160,
  filename,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

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

        // ตั้งค่า canvas ให้รองรับ HiDPI
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // คำนวณ scale ตาม canvas pixel
        const scale = Math.min(
          canvas.width / viewport.width,
          canvas.height / viewport.height
        );
        const scaledViewport = page.getViewport({ scale });

        // คำนวณ offset ให้ตรงกลาง
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

  return (
    <div
      onClick={() => window.open(fileUrl, "_blank")}
      style={{
        width: width + 40,
        height: height + 75,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        textAlign: "center",
        backgroundColor: "#fff",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
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
      {loading && (
        <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
          Loading...
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ borderRadius: 4, display: "block", margin: "0 auto" }}
      />
      <p
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={filename + ".PDF"}
      >
        {filename}.PDF
      </p>
    </div>
  );
};

export default PdfThumbnail;
