import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
const theme = createTheme({
  typography: {
    fontFamily: "'Kanit', sans-serif", // ฟอนต์ global ที่คุณอยากใช้
  },
  palette: {},
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <ToastContainer />
      <App />
    </ThemeProvider>
  </StrictMode>
);
