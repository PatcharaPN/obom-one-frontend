import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import { useSpring, animated } from "@react-spring/web";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { Icon } from "@iconify/react";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";

import { createTask, deleteTask } from "../../src/features/redux/TaskSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useEffect, useState } from "react";
import { fetchSale } from "../features/redux/UserSlice";
import type { IUser } from "../types/task";
import { Bounce, toast } from "react-toastify";
import TaskRow from "./TaskRow";
import DatePicker from "./DatePicker";

interface FadeProps {
  children: React.ReactElement<any>;
  in?: boolean;
  onEnter?: (node: HTMLElement, isAppearing: boolean) => void;
  onExited?: (node: HTMLElement, isAppearing: boolean) => void;
}
const taskTypes = ["งานด่วน", "งานแก้ไข", "งานเสีย", "งานใหม่"];
const Fade = React.forwardRef<HTMLDivElement, FadeProps>(function Fade(
  props,
  ref
) {
  const { children, in: open, onEnter, onExited, ...other } = props;
  const style = useSpring({
    from: { opacity: 0 },
    to: { opacity: open ? 1 : 0 },
    onStart: () => {
      if (open && onEnter) onEnter(null as any, true);
    },
    onRest: () => {
      if (!open && onExited) onExited(null as any, true);
    },
  });

  return (
    <animated.div ref={ref} style={style} {...other}>
      {children}
    </animated.div>
  );
});

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 650,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  overflowY: "auto",
  borderRadius: 2,
};

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  taskDataToEdit?: any;
  setTaskDataToEdit?: (data: any) => void; // เพิ่ม prop ฟังก์ชันนี้
}

export default function DetailModal({
  open,
  onClose,
  taskDataToEdit,
}: DetailModalProps) {
  const dispatch = useAppDispatch();
  const [subTaskCount] = useState(1);
  // const user = useAppSelector((state) => state.auth.user);
  const { sales } = useAppSelector((state) => state.user);
  const [titleName, setTitleName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyPrefix, setCompanyPrefix] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [qtNumber, setQtNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sale, setSale] = useState(""); // user id
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<string[]>(["งานใหม่"]);
  const [subtasks, setSubTasks] = useState<
    {
      name: string;
      material: string;
      quantity: number | "";
      attachments: File[];
    }[]
  >([{ name: "", material: "", quantity: "", attachments: [] }]);
  useEffect(() => {
    dispatch(fetchSale());
  }, [dispatch]);

  useEffect(() => {
    console.log("taskDataToEdit", taskDataToEdit);
    if (taskDataToEdit) {
      setTitleName(taskDataToEdit.titleName || "");
      setCompanyName(taskDataToEdit.companyName || "");
      setCompanyPrefix(taskDataToEdit.companyPrefix || "");
      setPoNumber(taskDataToEdit.poNumber || "");
      setQtNumber(taskDataToEdit.qtNumber || "");
      setSelectedDate(taskDataToEdit.dueDate || "");
      setSale(taskDataToEdit.sale?._id || "");
      setDescription(taskDataToEdit.description || "");
      setTaskType(taskDataToEdit.taskType || ["งานใหม่"]);
      setSubTasks(
        taskDataToEdit.tasks?.length
          ? taskDataToEdit.tasks.map((t: any) => ({
              name: t.name,
              material: t.material,
              quantity: t.quantity,
              attachments: (t.attachments || []).map((file: any) => ({
                ...file,
                name: file.originalName,
                path: file.path,
                _id: file._id,
              })),
            }))
          : [{ name: "", material: "", quantity: "", attachments: [] }]
      );
    }
  }, [taskDataToEdit]);
  const handleTaskChange = (index: number, newData: any) => {
    setSubTasks((prev) => {
      const newTasks = [...prev];
      newTasks[index] = newData;
      return newTasks;
    });
  };
  const addTaskRow = () => {
    setSubTasks((prev) => [
      ...prev,
      { name: "", material: "", quantity: "", attachments: [] },
    ]);
  };
  const removeRow = (taskIndex: number) => {
    setSubTasks((prevTasks) => prevTasks.filter((_, i) => i != taskIndex));
  };
  const validateForm = () => {
    if (
      !titleName ||
      !companyName ||
      !companyPrefix ||
      !poNumber ||
      !qtNumber ||
      !selectedDate ||
      !sale ||
      taskType.length === 0
    ) {
      toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน", {
        position: "bottom-right",
        theme: "colored",
      });
      return false;
    }

    for (const [index, task] of subtasks.entries()) {
      if (!task.material || task.quantity === "" || task.quantity <= 0) {
        toast.warning(`กรุณากรอกรายละเอียดในรายการที่ ${index + 1} ให้ครบ`, {
          position: "bottom-right",
          theme: "colored",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const formData = new FormData();
      formData.append("titleName", titleName);
      formData.append("companyName", companyName);
      formData.append("companyPrefix", companyPrefix);
      formData.append("poNumber", poNumber);
      formData.append("qtNumber", qtNumber);
      formData.append("sale", sale);
      formData.append("dueDate", selectedDate);
      formData.append("description", description || "");

      taskType.forEach((t) => formData.append("taskType[]", t));

      const tasksData = subtasks.map((task) => ({
        name: task.name,
        material: task.material,
        quantity: task.quantity,
      }));
      formData.append("tasks", JSON.stringify(tasksData));

      for (let idx = 0; idx < subtasks.length; idx++) {
        for (const file of subtasks[idx].attachments) {
          console.log("File name before upload:", file.name);
          const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
          if (!allowedTypes.includes(file.type)) {
            toast.warning(
              `ไฟล์ ${file.name} ในรายการที่ ${
                idx + 1
              } ไม่รองรับ (รองรับเฉพาะ PDF, JPG, PNG)`,
              {
                position: "bottom-right",
                theme: "colored",
              }
            );
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            toast.warning(
              `ไฟล์ ${file.name} ในรายการที่ ${idx + 1} มีขนาดเกิน 5MB`,
              {
                position: "bottom-right",
                theme: "colored",
              }
            );
            return;
          }

          formData.append(`tasks[${idx}][attachments]`, file);
        }
      }

      await dispatch(createTask(formData)).unwrap();

      toast.success("สร้างคำขอสำเร็จ", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });

      console.log([...formData]);
      onClose();
      return;
    } catch (err: any) {
      toast.error("เกิดข้อผิดพลาดในการสร้างคำขอ!", {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
      console.error("Error Log", err);
      return;
    }
  };
  const handleDelete = async () => {
    if (!taskDataToEdit?._id) return;

    const confirmed = window.confirm("แน่ใจหรือไม่ว่าต้องการลบคำขอนี้?");
    if (!confirmed) return;

    try {
      await dispatch(deleteTask(taskDataToEdit._id)).unwrap();

      toast.success("ลบคำขอสำเร็จ", {
        position: "bottom-right",
        theme: "colored",
      });

      onClose();
    } catch (err: any) {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`, {
        position: "bottom-right",
        theme: "colored",
      });
      console.error("Delete error:", err);
    }
  };

  return (
    <Modal
      aria-labelledby="spring-modal-title"
      aria-describedby="spring-modal-description"
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { TransitionComponent: Fade } }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography
            className="flex justify-between"
            id="spring-modal-title"
            variant="h6"
            component="h2"
          >
            {taskDataToEdit ? "แก้ไขคำขอ" : "เพิ่มคำขอผลิตงาน"}
            <span
              className="cursor-pointer"
              onClick={() => {
                onClose();
              }}
            >
              <Icon icon={"mdi:close"} width={24} />
            </span>
          </Typography>
          <Typography id="spring-modal-description">
            สร้างข้อมูลการผลิตไปยังแผนการผลิต
          </Typography>
          <form className="space-y-4 mt-2">
            <div className="flex gap-5">
              <TextField
                id="outlined-password-input"
                label="ชื่อบริษัท"
                required
                type="text"
                size="small"
                className="flex-1"
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
              />
              <div className="flex-1">
                {" "}
                <Typography
                  className="absolute top-17"
                  variant="body2"
                  sx={{ mb: 0.5, color: "#6b7280" }}
                >
                  วันจัดส่ง
                </Typography>
                <DatePicker date={selectedDate} setDate={setSelectedDate} />
              </div>
            </div>
            <div className="flex gap-5 mt-5">
              <TextField
                id="outlined-password-input"
                label="โค๊ดงาน"
                fullWidth={true}
                required={true}
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                size="small"
              />
              <TextField
                id="outlined-password-input"
                label="ชื่อย่อ"
                fullWidth={true}
                required={true}
                value={companyPrefix}
                onChange={(e) => setCompanyPrefix(e.target.value)}
                type="text"
                size="small"
              />
            </div>
            <div className="flex gap-5 mt-2">
              <TextField
                id="outlined-password-input"
                label="เลขใบสั่งซื้อ (PO)"
                fullWidth={true}
                type="jobName"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                size="small"
              />
              <TextField
                id="outlined-password-input"
                label="เลขใบเสนอราคา (QT)"
                fullWidth={true}
                value={qtNumber}
                onChange={(e) => setQtNumber(e.target.value)}
                type="jobName"
                size="small"
              />
            </div>
            {/* <div className="flex gap-5 mt-2">
              <FormControl sx={{ width: "100%" }} variant="outlined">
                <OutlinedInput
                  id="outlined-adornment-weight"
                  endAdornment={
                    <InputAdornment position="end">รายการ</InputAdornment>
                  }
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{ "aria-label": "weight" }}
                  size="small"
                  onChange={(e) =>
                    setQuantity(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
                <FormHelperText id="outlined-weight-helper-text">
                  จำนวนการสั่งซื้อ*
                </FormHelperText>
              </FormControl>
              <FormControl sx={{ width: "100%" }} variant="outlined">
                <OutlinedInput
                  size="small"
                  id="outlined-adornment-weight"
                  onChange={(e) =>
                    setProductUnit(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  endAdornment={
                    <InputAdornment position="end">ชิ้น</InputAdornment>
                  }s
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{ "aria-label": "weight" }}
                />
                <FormHelperText id="outlined-weight-helper-text">
                  หน่วยจำนวนสินค้าต่อรายการ*
                </FormHelperText>
              </FormControl>
            </div> */}
            <Box>
              <Typography
                id="spring-modal-description"
                className="mb-2 font-semibold flex items-center gap-2"
              >
                รายการขึ้นงาน/ไฟล์แนบ
                <p className="opacity-50">({subTaskCount.toString()} รายการ)</p>
              </Typography>

              <div
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#9ca3af #f3f4f6", // thumb / track (Firefox)
                }}
                className="max-h-[180px] overflow-y-auto border border-gray-200 rounded p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              >
                {subtasks.map((task, idx) => (
                  <TaskRow
                    key={idx}
                    index={idx}
                    data={task}
                    onDelete={removeRow}
                    onChange={handleTaskChange}
                  />
                ))}
              </div>

              <div className="w-full flex justify-center items-center mt-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addTaskRow();
                  }}
                  className="flex gap-1 px-3 py-1 text-[#0079CA] hover:text-[#005a8d] transition-colors items-center"
                >
                  เพิ่มรายการใหม่
                  <Icon icon="ic:round-plus" width="24" height="24" />
                </button>
              </div>
            </Box>
            <FormControl fullWidth>
              <InputLabel id="demo-simple-select-label" size="small">
                เจ้าหน้าที่ฝ่ายขายที่รับผิดชอบ
              </InputLabel>
              <Select
                labelId="sale-select-label"
                id="sale-select"
                size="small"
                value={sale}
                onChange={(e) => setSale(e.target.value)}
                label="เจ้าหน้าที่ฝ่ายขายที่รับผิดชอบ"
              >
                {sales.map((s: IUser) => (
                  <MenuItem
                    key={s._id}
                    value={s._id}
                    sx={{
                      display: "flex",
                      justifyItems: "center",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <div className="flex gap-2">
                      <img
                        src={
                          `${import.meta.env.VITE_BASE_URL}/api/${
                            s.profilePic
                          }` || ""
                        }
                        alt="Profile"
                        className="rounded-full w-6 h-6 object-cover"
                      />{" "}
                      {s.name} {s.surname}
                    </div>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              className="mt-5"
              multiple
              onChange={(_, value) => setTaskType(value)}
              options={taskTypes}
              value={taskType}
              filterSelectedOptions
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="ชนิดของงาน"
                  placeholder="เลือกชนิดงาน"
                  size="small"
                />
              )}
            />{" "}
            <Typography
              id="spring-modal-description"
              className=" font-semibold"
            >
              รายระเอียดเพิ่มเติม
            </Typography>
            <TextareaAutosize
              aria-label="empty textarea"
              placeholder="รายละเอียดเพิ่มเติม"
              value={description}
              style={{
                width: "100%",
                marginTop: 10,
                minHeight: 100,
                borderRadius: 8,
                border: "1px solid #C4C4C4",
                padding: 10,
              }}
            />
            {/* <Box
              sx={{
                border: "2px dashed #C4C4C4",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
            >
              ลากไฟล์มาวาง หรือ คลิ๊กเพื่ออัพโหลด
              <input
                type="file"
                name="attachments"
                multiple
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(Array.from(e.target.files));
                    console.log(Array.from(e.target.files));
                  }
                }}
              />
              <ul>
                {files.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </Box> */}
          </form>
          <Box className="flex justify-end mt-2 gap-2">
            {taskDataToEdit ? (
              <Button
                color="error"
                variant="outlined"
                onClick={handleDelete}
                startIcon={<Icon icon="mdi:trash-can-outline" />}
                sx={{
                  height: 40,
                  py: 0,
                  "& .MuiButton-startIcon": {
                    margin: 0,
                  },
                }}
              >
                ลบคำขอ
              </Button>
            ) : (
              <></>
            )}
            <Button
              variant="outlined"
              sx={{
                height: 40,
                py: 0,
              }}
            >
              บันทึกฉบับร่าง
            </Button>

            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                height: 40,
                py: 0,
              }}
            >
              {taskDataToEdit ? "แก้ไข" : "สร้างคำขอผลิตงาน"}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
