import axios from "axios";
import { Bounce, toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error("🔒 Session หมดอายุ กรุณาเข้าสู่ระบบใหม่", {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        transition: Bounce,
      });

      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
