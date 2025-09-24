import { Icon } from "@iconify/react";
import type { SidebarProps } from "../types/interface";
import { menuItems } from "../config/SidebarMenu";
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  isCollapsed,
  toggleCollapse,
  activeItem,
  onSelectItem,
}: SidebarProps) {
  const navigate = useNavigate();
  const handleLogout = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
    } catch (error) {
      console.log("An error occurred during logout:", error);
    }
  };
  return (
    <div
      className={`rounded-tr-2xl rounded-br-2xl relative bg-gradient-to-b from-[#005B98] to-[#003C65] text-[#00C3FF] transition-all duration-300 ${
        isCollapsed ? "w-[50px]" : "w-[250px]"
      }`}
    >
      <button
        className="rounded-full absolute top-1/2 -right-4 p-2 w-10 bg-[#026DB5] cursor-pointer hover:bg-[#004674] transform -translate-y-1/2"
        onClick={toggleCollapse}
      >
        {isCollapsed ? "→" : "←"}
      </button>

      <ul className="min-h-screen grid grid-rows-3">
        <img
          className={`mx-auto mt-20 mb-10 transition-all duration-300 ${
            isCollapsed ? "w-0 h-0" : "w-0 h-0"
          }`}
          src="./LOGO.png"
        />
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <li
              key={item.key}
              className={`flex justify-start items-center gap-2 p-2 cursor-pointer hover:bg-[#003457] ${
                activeItem === item.key ? "bg-[#0098FF]/30 rounded-full" : ""
              }`}
              onClick={() => onSelectItem(item.key)}
            >
              <Icon icon={item.icon} width="30" color="" />
              {!isCollapsed && <span>{item.label}</span>}
            </li>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="flex gap-2 self-end mb-4 p-2 hover:bg-gray-700 rounded"
          >
            <Icon
              icon="material-symbols:logout-rounded"
              width="24"
              height="24"
            />
            {!isCollapsed && <span>ลงชื่อออก</span>}
          </button>
        </div>
      </ul>
    </div>
  );
}
