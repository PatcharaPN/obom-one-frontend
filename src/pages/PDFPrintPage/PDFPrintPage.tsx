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
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    const loadPdf = async () => {
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    };
    loadPdf();
  }, [fileUrl]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      await page.render(renderContext).promise;
    };
    renderPage();
  }, [pdfDoc, pageNum, scale]);

  const handlePrint = async () => {
    if (!pdfDoc) return;

    const dataUrls: string[] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport }).promise;

      // เพิ่มลายน้ำ
      const watermarkText = "สำเนา";
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "red";
      ctx.font = `${Math.floor(canvas.width / 10)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-30 * Math.PI) / 180);
      ctx.fillText(watermarkText, 0, 0);
      ctx.restore();

      dataUrls.push(canvas.toDataURL("image/png"));
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const style = `
    <style>
      @page { size: auto; margin: 0; }
      body { margin: 0; padding: 0; }
      img {
        width: 100vw;       /* เต็มหน้ากระดาษแนวนอน */
        height: 100vh;      /* เต็มหน้ากระดาษแนวตั้ง */
        object-fit: contain; /* ขนาดรูปพอดีโดยไม่บีบอัด */
        display: block;
        page-break-after: always;
      }
    </style>
  `;

    const html = dataUrls.map((src) => `<img src="${src}" />`).join("");

    printWindow.document.write(style + html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="bg-gray-100 w-full h-full p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-800"
        >
          <Icon icon="lets-icons:back" width="20" height="20" />
          <span>ย้อนกลับ</span>
        </div>

        <button
          onClick={() => setScale((prev) => prev + 0.25)}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Zoom In
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.25))}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Zoom Out
        </button>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          Print
        </button>
      </div>

      <div className="flex flex-col items-center overflow-auto border rounded bg-white p-2 flex-1">
        <canvas ref={canvasRef} className="" />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setPageNum((prev) => Math.max(prev - 1, 1))}
            className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
            disabled={pageNum === 1}
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
            className="px-2 py-1 bg-gray-300 rounded disabled:opacity-50"
            disabled={pageNum === pdfDoc?.numPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFPrintPage;
