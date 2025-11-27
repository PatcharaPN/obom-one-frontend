import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Mobile Overlay */}
      {isMobile && isCollapsed && (
        <div
          onClick={() => setIsCollapsed(false)}
          className="fixed inset-0 bg-black/40 z-20"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-30 bg-white shadow-lg transition-all duration-300 
          ${
            isMobile
              ? isCollapsed
                ? "w-64 translate-x-0"
                : "w-64 -translate-x-full"
              : isCollapsed
              ? "w-[60px]"
              : "w-[250px]"
          }
        `}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          activeItem={activeItem}
          onSelectItem={setActiveItem}
        />
      </div>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          isMobile
            ? "ml-0" // mobile ไม่ต้องเลื่อนหน้าเพราะ sidebar เป็น overlay
            : isCollapsed
            ? "ml-[60px]"
            : "ml-[250px]"
        } p-5 bg-white min-h-screen`}
      >
        {/* Mobile Toggle Button */}
        {isMobile && (
          <button
            onClick={toggleCollapse}
            className="mb-4 p-2 bg-gray-100 rounded shadow-md"
          >
            ☰ เมนู
          </button>
        )}

        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
