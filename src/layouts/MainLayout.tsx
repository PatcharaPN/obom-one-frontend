import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import SectionLayout from "./SectionLayout";
import { subMenuItems } from "../config/SidebarMenu";

const MainLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeItem, setActiveItem] = useState("home");
  const [activeSectionItem, setActiveSectionItem] = useState("appeal");
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);
  return (
    <div
      className={`grid transition-all duration-300  ${
        isCollapsed
          ? "grid-cols-[50px_250px_1fr]"
          : "grid-cols-[250px_250px_1fr]"
      } min-h-screen`}
    >
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
        activeItem={activeItem}
        onSelectItem={setActiveItem}
      />{" "}
      <SectionLayout
        activeItem={activeSectionItem}
        onSelectItem={setActiveSectionItem}
        title={"บริการ"}
        subTitle="คำขอ"
        menuItems={subMenuItems}
      />
      <main className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
