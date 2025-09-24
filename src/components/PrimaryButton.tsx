import { Icon } from "@iconify/react";
import type { ButtonProps } from "../types/interface";

const PrimaryButton = ({
  label,
  onClick,
  disabled,
  icon,
  variant = "primary",
}: ButtonProps) => {
  const variantStyle = {
    primary: "bg-[#007ACC] text-white hover:bg-[#005893]",
    secondary: "bg-gray-300 text-black hover:bg-gray-400",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-4 py-2 cursor-pointer flex items-center gap-2  ${
        variantStyle[variant]
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {" "}
      <span>{label}</span>
      {icon && <Icon icon={icon} />}
    </button>
  );
};

export default PrimaryButton;
