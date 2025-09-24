import axiosInstance from "../contexts/axiosInstance";

export const fetchTasks = async () => {
  try {
    const response = await axiosInstance.get("/task/getAllTasks");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    throw error;
  }
};
