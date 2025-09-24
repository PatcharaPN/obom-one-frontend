import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { useNavigateWithLoading } from "../../hooks/useNavigate";
import { loginUser } from "../../features/redux/AuthSlice";

interface IFormInput {
  email: string;
  password: string;
}

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInput>();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );
  const { navigateWithLoading } = useNavigateWithLoading();
  const [showSpinner, setShowSpinner] = useState(false);

  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    dispatch(loginUser(data));
  };

  useEffect(() => {
    if (isAuthenticated) {
      // แสดง spinner ก่อน redirect
      setShowSpinner(true);
      const timer = setTimeout(() => {
        navigateWithLoading("/Home", 0); // navigate ทันทีหลัง spinner
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, navigateWithLoading]);

  return (
    <div className="grid grid-cols-[1fr_600px] min-h-screen">
      {/* Left side: Background */}
      <div>
        <div className="absolute top-35 left-20 text-4xl font-bold text-white z-10">
          <p className="font-normal scale-160">
            OBOM <br />
            <span className=" font-semibold bg-gradient-to-r from-[#00B9A7] to-[#0269AE] bg-clip-text text-transparent">
              ONE
            </span>
          </p>
        </div>
        <p className="w-150 text-xl absolute top-62 left-15 text-white/70 z-10">
          แพลตฟอร์มศูนย์กลางครบวงจร รวมทุกการจัดการและการทำงานไว้ในที่เดียว
          สะดวก รวดเร็ว และเข้าถึงได้ทุกที่ ทุกเวลา
        </p>
        <img
          className="object-cover h-full w-full brightness-50"
          src="./background/background.jpg"
          alt=""
        />
      </div>

      {/* Right side: Form / Spinner */}
      <div className="flex flex-col justify-center items-center h-full px-10">
        <div className="max-w-sm w-full bg-white rounded-lg p-6">
          {showSpinner ? (
            <div className="flex justify-center items-center h-96">
              <CircularProgress size={60} />
            </div>
          ) : (
            <>
              <div className="py-6">
                <h2 className="text-start text-5xl font-bold bg-gradient-to-r from-[#00B9A7] to-[#0269AE] bg-clip-text text-transparent">
                  ยินดีต้อนรับ
                </h2>
                <p className="opacity-70">เข้าสู่ระบบด้วยอีเมล</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register("email", { required: "กรุณากรอกอีเมล" })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{
                    borderRadius: "9999px",
                    "& fieldset": { borderRadius: "9999px" },
                  }}
                />

                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  {...register("password", { required: "กรุณากรอกรหัสผ่าน" })}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  sx={{
                    borderRadius: "9999px",
                    "& fieldset": { borderRadius: "9999px" },
                  }}
                />

                <p className="opacity-30 hover:opacity-90 text-blue-600 cursor-pointer">
                  ลืมรหัสผ่าน ?
                </p>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ borderRadius: "9999px", width: "100%", py: 1.5 }}
                >
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
