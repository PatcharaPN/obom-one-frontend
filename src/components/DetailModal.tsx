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
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import TextField from "@mui/material/TextField";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";

import { createTask } from "../../src/features/redux/TaskSlice";
import { useAppDispatch, useAppSelector } from "../store";
import { useEffect } from "react";
import { fetchSale } from "../features/redux/UserSlice";
import type { IUser } from "../types/task";
import { Bounce, toast } from "react-toastify";

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
  width: 650,
  height: "fit-content",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function DetailModal({ open, onClose }: DetailModalProps) {
  const dispatch = useAppDispatch();
  const { sales } = useAppSelector((state) => state.user);
  const [titleName, setTitleName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [companyPrefix, setCompanyPrefix] = React.useState("");
  const [poNumber, setPoNumber] = React.useState("");
  const [qtNumber, setQtNumber] = React.useState("");
  const [quantity, setQuantity] = React.useState<number | "">("");
  const [productUnit, setProductUnit] = React.useState<number | "">("");
  const [sale, setSale] = React.useState(""); // user id
  const [description] = React.useState("");
  const [taskType, setTaskType] = React.useState<string[]>(["งานใหม่"]);
  const [files] = React.useState<File[]>([]);

  // const { loading, error } = useAppSelector((state) => state.task);

  useEffect(() => {
    dispatch(fetchSale());
  }, [dispatch]);

  console.log(sales);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("titleName", titleName);
    formData.append("companyName", companyName);
    formData.append("companyPrefix", companyPrefix);
    formData.append("poNumber", poNumber);
    formData.append("qtNumber", qtNumber);
    formData.append("quantity", String(quantity));
    formData.append("productUnit", String(productUnit));
    formData.append("sale", sale);
    formData.append("description", description);
    taskType.forEach((t) => formData.append("taskType[]", t));
    files.forEach((file) => formData.append("files", file));

    dispatch(createTask(formData))
      .unwrap()
      .then(() => {
        toast("🦄 Wow so easy!", {
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
        console.log("สร้างงานสำเร็จ");
        onClose();
      })
      .catch((err) => {
        toast.error("เกิดข้อผิดพลาดในการสร้างคำขอ !", {
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
      });
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
            เพิ่มคำขอผลิตงาน
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
            <TextField
              id="outlined-password-input"
              label="ชื่อรายการ"
              fullWidth={true}
              required={true}
              type="text"
              size="small"
              onChange={(e) => setTitleName(e.target.value)}
            />
            <div className="flex gap-5 mt-5">
              <TextField
                id="outlined-password-input"
                label="บริษัท"
                fullWidth={true}
                required={true}
                type="text"
                onChange={(e) => setCompanyName(e.target.value)}
                size="small"
              />
              <TextField
                id="outlined-password-input"
                label="ชื่อย่อ"
                fullWidth={true}
                required={true}
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
                required={true}
                type="jobName"
                onChange={(e) => setPoNumber(e.target.value)}
                size="small"
              />
              <TextField
                id="outlined-password-input"
                label="เลขใบเสนอราคา (QT)"
                fullWidth={true}
                required={true}
                onChange={(e) => setQtNumber(e.target.value)}
                type="jobName"
                size="small"
              />
            </div>
            <div className="flex gap-5 mt-2">
              <FormControl sx={{ width: "100%" }} variant="outlined">
                <OutlinedInput
                  id="outlined-adornment-weight"
                  endAdornment={
                    <InputAdornment position="end">เซ็ท</InputAdornment>
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
                  จำนวนการสั่งซื้อ (QT)*
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
                  }
                  aria-describedby="outlined-weight-helper-text"
                  inputProps={{ "aria-label": "weight" }}
                />
                <FormHelperText id="outlined-weight-helper-text">
                  หน่วยจำนวนสินค้า*
                </FormHelperText>
              </FormControl>
            </div>
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
                    <div>
                      <img
                        src={`${import.meta.env.VITE_BASE_URL}/${s.profilePic}`}
                        alt="Profile"
                        className="rounded-full w-6 h-6 object-cover"
                      />
                    </div>
                    {s.name} {s.surname}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              className="mt-5"
              multiple
              onChange={(_, value) => setTaskType(value)}
              options={taskTypes}
              // getOptionLabel={(option) => option}
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
            />
            <TextareaAutosize
              aria-label="empty textarea"
              placeholder="รายละเอียดเพิ่มเติม"
              style={{
                width: "100%",
                marginTop: 20,
                minHeight: 100,
                borderRadius: 8,
                border: "1px solid #C4C4C4",
                padding: 10,
              }}
            />
            <Box
              sx={{
                border: "2px dashed #C4C4C4",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              ลากไฟล์มาวาง หรือ คลิ๊กเพื่ออัพโหลด
              <input type="file" className="opacity-0" />
            </Box>
          </form>
          <Box className="flex justify-end mt-2 gap-2">
            {" "}
            <Button variant="outlined">บันทึกฉบับร่าง</Button>
            <Button onClick={handleSubmit} variant="contained">
              สร้างคำขอผลิตงาน
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
