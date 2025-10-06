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
    primary:
      "bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 text-white",
    secondary: "bg-gray-300 to-gray-400 text-black",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative cursor-pointer rounded-full px-5 py-2 flex items-center gap-2 justify-center
         transition-all transform 
        hover:-translate-y-0.5 hover:scale-[1] 
        ${variantStyle[variant]}
        ${
          disabled
            ? "opacity-50 cursor-not-allowed hover:translate-y-0 hover:scale-100"
            : ""
        }
      `}
    >
      <span>{label}</span>
      {icon && <Icon icon={icon} width="20" height="20" />}
    </button>
  );
};

export default PrimaryButton;
