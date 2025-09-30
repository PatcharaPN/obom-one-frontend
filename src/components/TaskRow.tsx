import { Icon } from "@iconify/react";
import React from "react";

export interface TaskRowProps {
  index: number;
  data: {
    name: string;
    material: string;
    quantity: number | "";
    attachments: File[];
  };
  onDelete: (index: number) => void;
  onChange: (index: number, newData: any) => void;
}

const TaskRow = ({ index, data, onChange, onDelete }: TaskRowProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const newFiles = Array.from(event.target.files);
    onChange(index, {
      ...data,
      attachments: [...data.attachments, ...newFiles],
    });
  };

  const removeAttachment = (fileIndex: number) => {
    const newAttachments = data.attachments.filter((_, i) => i !== fileIndex);
    onChange(index, { ...data, attachments: newAttachments });
  };

  const handleFieldChange = (field: string, value: any) => {
    onChange(index, { ...data, [field]: value });
  };

  return (
    <div className="mt-2 rounded-sm p-2 border border-gray-300">
      <div className="flex w-full h-10 overflow-hidden border border-gray-300 rounded-sm">
        <input
          type="text"
          className="flex-1 min-w-0 px-2 outline-none border-r border-gray-200"
          placeholder="ชื่อชิ้นงาน"
          onChange={(e) => handleFieldChange("name", e.target.value)}
        />
        <select
          name="material"
          onChange={(e) => handleFieldChange("material", e.target.value)}
          className="flex-1 min-w-0 px-2 outline-none text-sm border-r border-gray-200"
        >
          <option value="">เลือกชนิด Material</option>
          <option value="SKS3">SKS3</option>
          <option value="S45C">S45C</option>
          <option value="SKD11">SKD11</option>
        </select>
        <input
          type="number"
          className="flex-1 min-w-0 px-2 outline-none border-r border-gray-200"
          placeholder="จำนวน"
          onChange={(e) =>
            handleFieldChange("quantity", e.target.valueAsNumber)
          }
        />
        <div className="flex-[0.5] flex items-center justify-evenly bg-gray-100 px-2 text-sm">
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(index);
            }}
          >
            <Icon icon="tabler:trash" color="#FF5858" width="17" height="17" />
          </button>
          <button>
            <Icon icon="lucide:edit" color="#FF8800" width="17" height="17" />
          </button>
        </div>
      </div>

      {/* Attachments Section */}
      <div className="mt-2 px-2">
        <p className="text-[0.8rem] font-semibold mb-1">ไฟล์แนบ</p>

        <div className="flex flex-col space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
          {data.attachments.length === 0 && (
            <p className="text-gray-400 text-sm pl-2">ยังไม่มีไฟล์แนบ</p>
          )}

          {data.attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded"
            >
              <span className="text-sm">{file.name}</span>
              <button
                onClick={() => removeAttachment(idx)}
                className="text-red-500 flex items-center gap-1"
              >
                <Icon icon="tabler:trash" width={16} height={16} />
                ลบ
              </button>
            </div>
          ))}
        </div>

        {/* Upload Input */}
        <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-[#0079CA] hover:text-[#005a8d]">
          <Icon icon="ic:round-upload-file" width={20} height={20} />
          เพิ่มไฟล์แนบ
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};

export default TaskRow;
