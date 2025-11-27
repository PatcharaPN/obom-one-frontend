import { Icon } from "@iconify/react";
import PdfThumbnail from "../../components/PDFThumbnail";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../contexts/axiosInstance";
import { useInView } from "react-intersection-observer";

const LazyPdfThumbnail = ({ d }: { d: any }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref} className="flex justify-center">
      {inView ? (
        <PdfThumbnail
          drawingInfo={{
            customer: undefined,
            poNumber: undefined,
            qtNumber: undefined,
          }}
          material={d.material}
          fileUrl={`${import.meta.env.VITE_BASE_URL}/api/` + d.pdfPath}
          filename={d.name}
          filePath=""
          onPrint={() => {}}
        />
      ) : (
        <div className="w-[200px] h-[280px] bg-gray-200 rounded-md animate-pulse" />
      )}
    </div>
  );
};

const DrawingPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm] = useState("");
  const [companyFilter] = useState<"ALL" | "J" | "S">("ALL");
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          "https://one.obomgauge.com/api/api/drawing"
        );
        setTasks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);
  const filteredTasks = useMemo(() => {
    const names = tasks.map((t: any) => t.name);
    const parentNames = new Set<string>();

    // หาว่าตัวไหนมีลูก (Parent)
    names.forEach((n) => {
      const base = n.split("-").slice(0, -1).join("-");
      if (names.includes(base)) {
        parentNames.add(base);
      }
    });

    // ตัด parent ออก + filter บริษัท + ค้นหา
    return tasks
      .filter((t: any) => !parentNames.has(t.name))
      .filter((t: any) => {
        const matchCompany =
          companyFilter === "ALL" ||
          (companyFilter === "J" && t.name.startsWith("J")) ||
          (companyFilter === "S" && t.name.startsWith("S"));
        const matchSearch = t.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchCompany && matchSearch;
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "th"));
  }, [tasks, searchTerm, companyFilter]);
  if (loading) return <p>Loading...</p>;

  return (
    <div className="h-full grid grid-rows-[170px_auto]">
      <div className="p-5 bg-gray-100">
        <h1 className="text-2xl">รายการแบบ</h1>

        <div className="flex gap-2 py-10">
          <div className="flex items-center p-2 bg-white rounded-md">
            <Icon icon={"mingcute:hashtag-line"} width={15} height={15} />
            <input
              type="text"
              className="ml-2 w-full bg-transparent outline-none placeholder-gray-400"
              placeholder="รหัสการผลิต"
            />
          </div>
          <div className="flex items-center p-2 bg-white rounded-md">
            <Icon icon={"lucide:tag"} width={15} height={15} />
            <input
              type="text"
              className="ml-2 w-full bg-transparent outline-none placeholder-gray-400"
              placeholder="ชื่องาน"
            />
          </div>
          <div className="flex items-center p-2 bg-white rounded-md">
            <Icon icon={"octicon:people-16"} width={15} height={15} />
            <input
              type="text"
              className="ml-2 w-full bg-transparent outline-none placeholder-gray-400"
              placeholder="ชื่อลูกค้า"
            />
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xl">รวมทั้งหมด {tasks.length} รายการ</p>
        <div className="w-full">
          <div className=" grid grid-cols-6 gap-4 pt-8">
            {filteredTasks.map((d, dIdx) => (
              <LazyPdfThumbnail key={dIdx} d={d} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingPage;
