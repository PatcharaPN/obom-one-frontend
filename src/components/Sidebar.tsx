import { Icon } from "@iconify/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SidebarProps } from "../types/interface";
import { menuItems } from "../config/SidebarMenu";
import CurrentUserComponent from "./CurrentUserComponent";

export default function Sidebar({
  isCollapsed,
  activeItem,
  onSelectItem,
}: SidebarProps) {
  const navigate = useNavigate();
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>(
    {}
  );

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`rounded-tr-2xl rounded-br-2xl h-screen sticky top-0 bg-gradient-to-b from-[#001F33] to-[#003C65] text-[#00C3FF] transition-all duration-500 shadow-lg ${
        isCollapsed ? "w-[60px]" : "w-[260px]"
      }`}
    >
      {/* Collapse button */}
      {/* <button
        className="absolute top-1/2 right-2 p-2 w-10 h-10 bg-[#026DB5] hover:bg-[#004674] rounded-full flex items-center justify-center text-white shadow-md transform -translate-y-1/2 transition-all duration-300"
        onClick={toggleCollapse}
      >
        {isCollapsed ? "→" : "←"}
      </button> */}

      <ul className="min-h-screen grid grid-rows-[200px_auto_100px]">
        {/* Logo */}
        <img
          className={`mx-auto mt-16 mb-8 transition-all duration-300 ${
            isCollapsed ? "w-12 h-auto" : "w-24 h-24"
          }`}
          src="/LOGO.png"
          alt="Logo"
        />

        {/* Menu Items */}
        <div className="flex flex-col gap-7 px-2">
          {menuItems.map((item) => {
            const isSubmenuOpen =
              item.submenu?.some((sub) => sub.key === activeItem) ||
              openSubmenus[item.key];
            return (
              <li key={item.key} className="flex flex-col">
                {/* Main item */}
                <div
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-300
                    hover:bg-gradient-to-r hover:from-[#0066FF] hover:to-[#00C3FF] hover:text-white
                    ${
                      activeItem === item.key
                        ? "bg-[#0098FF]/40 text-white"
                        : ""
                    } 
                    ${isCollapsed ? "justify-center" : "justify-start"}`}
                  onClick={() => {
                    if (item.submenu) {
                      toggleSubmenu(item.key);
                    } else if (item.path) {
                      onSelectItem(item.key);
                      navigate(item.path);
                    }
                  }}
                >
                  <Icon icon={item.icon} width="24" />
                  {!isCollapsed && (
                    <span className="transition-all duration-300">
                      {item.label}
                    </span>
                  )}
                  {item.submenu && !isCollapsed && (
                    <span className="ml-auto text-sm">
                      <Icon
                        icon={
                          isSubmenuOpen
                            ? "icon-park-solid:up-one"
                            : "icon-park-solid:down-one"
                        }
                        width="15"
                        height="15"
                      />
                    </span>
                  )}
                </div>

                {/* Submenu */}
                {item.submenu && isSubmenuOpen && !isCollapsed && (
                  <ul className="ml-6 mt-1 flex flex-col gap-1 overflow-hidden animate-slideDown">
                    {item.submenu.map((sub) => (
                      <li
                        key={sub.key}
                        className={`p-2 rounded-lg cursor-pointer transition-all duration-300 hover:bg-[#004574] ${
                          activeItem === sub.key
                            ? "bg-[#0098FF]/60 text-white"
                            : ""
                        }`}
                        onClick={() => {
                          onSelectItem(sub.key);
                          if (sub.path) navigate(sub.path);
                        }}
                      >
                        {sub.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </div>

        {/* Footer / User */}
        <div className="flex justify-center mt-4">
          <CurrentUserComponent />
        </div>
      </ul>
    </div>
  );
}
