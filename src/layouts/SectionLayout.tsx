import { Icon } from "@iconify/react";
import type { SectionLayoutProps } from "../types/interface";
import { useNavigate } from "react-router-dom";

const SectionLayout = ({
  title,
  subTitle,
  menuItems,
  activeItem,

  onSelectItem,
}: SectionLayoutProps) => {
  const navigate = useNavigate();
  return (
    <div className="bg-[#F8F8F8] flex flex-col w-60 h-screen sticky top-0">
      <div className="p-5">
        <h1 className="text-2xl">{title}</h1>
        {subTitle && <p className="text-xl pt-25">{subTitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <ul className="gap-2 flex flex-col">
          {menuItems?.map((i) => (
            <li
              className={`flex items-center p-2 gap-3 cursor-pointer rounded ${
                activeItem === i.key ? "bg-white text-[#026CB4] shadow " : ""
              }`}
              onClick={() => {
                onSelectItem(i.key), navigate(i.path);
              }}
              key={i.key}
            >
              <Icon width="26" icon={i.icon} /> <span>{i.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-5"></div>
    </div>
  );
};

export default SectionLayout;
