import axiosInstance from "../contexts/axiosInstance";

export const fetchSales = async () => {
  try {
    const response = await axiosInstance.get("/auth/sale");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    throw error;
  }
};
