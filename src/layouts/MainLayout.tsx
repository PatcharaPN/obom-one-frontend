import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("home");

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  return (
    <div
      className={`grid transition-all duration-300  ${
        isCollapsed ? "grid-cols-[50px_1fr]" : "grid-cols-[250px_1fr]"
      } min-h-screen`}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        activeItem={activeItem}
        onSelectItem={setActiveItem}
      />{" "}
      <main className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
