import { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import type { IUser } from "../types/task";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface SubTask {
  name: string;
  material: string;
  quantity: number;
}

interface Task {
  _id: string;
  titleName: string;
  companyName: string;
  poNumber?: string;
  qtNumber?: string;
  quantity?: number;
  sale?: IUser;
  tasks?: SubTask[];
}

interface SummaryModalProps {
  open: boolean;
  onClose: () => void;
  date?: string;
  tasksForDate?: Task[];
}

const SummaryModal = ({
  open,
  onClose,
  date,
  tasksForDate = [],
}: SummaryModalProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`summary_${date || "export"}.pdf`);
  };

  const handleExportImage = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = `สรุปการผลิตงาน_${date || "export"}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>สรุปงาน</DialogTitle>
      <DialogContent>
        <div ref={printRef}>
          <h3 className="text-xl">
            ขึ้นงานประจำวันที่ {date || "..."} <br /> จำนวนทั้งหมด{" "}
            {tasksForDate.length} รายการ
          </h3>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ชื่อบริษัท</TableCell>
                <TableCell>PO/QO</TableCell>
                <TableCell>จำนวน</TableCell>
                <TableCell>เซลผู้รับผิดชอบ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasksForDate.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    ไม่มีงานในวันที่เลือก
                  </TableCell>
                </TableRow>
              ) : (
                tasksForDate.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>{task.titleName}</TableCell>
                    <TableCell>
                      {task.poNumber || "-"} / {task.qtNumber || "-"}
                    </TableCell>
                    <TableCell>
                      {task.quantity ??
                        (task.tasks?.reduce((sum, t) => sum + t.quantity, 0) ||
                          "-")}{" "}
                      ชิ้น
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <img
                          src={
                            task.sale?.profilePic
                              ? `${import.meta.env.VITE_BASE_URL}/api/${
                                  task.sale?.profilePic
                                }`
                              : ""
                          }
                          alt="Profile"
                          className="rounded-full w-6 h-6 object-cover"
                        />{" "}
                        {task.sale?.name} {task.sale?.surname}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleExportPDF}>Export PDF</Button>
        <Button onClick={handleExportImage}>Export Image</Button>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SummaryModal;
