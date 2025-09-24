import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

interface PdfThumbnailProps {
  fileUrl: string;
  width?: number;
  filename: string;
}

const PdfThumbnail: React.FC<PdfThumbnailProps> = ({
  fileUrl,
  width = 120,
  filename,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderPdf = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({
          scale: width / page.getViewport({ scale: 1 }).width,
        });

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({
            canvasContext: canvas.getContext("2d")!,
            viewport,
          }).promise;
          setLoading(false);
        }
      } catch (err) {
        console.error("Error rendering PDF:", err);
      }
    };

    renderPdf();
  }, [fileUrl, width]);

  return (
    <div
      style={{
        width: width + 20,
        padding: 8,
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
      <canvas ref={canvasRef} style={{ borderRadius: 4 }}></canvas>
      <p
        style={{
          marginTop: 6,
          fontSize: 12,
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={filename + ".PDF"}
      >
        {filename}.PDF
      </p>
    </div>
  );
};

export default PdfThumbnail;
