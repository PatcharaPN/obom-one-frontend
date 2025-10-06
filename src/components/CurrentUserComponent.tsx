import { useSelector, useDispatch } from "react-redux";

import { useNavigate } from "react-router-dom";
import type { RootState } from "../store";
import { logout } from "../features/redux/AuthSlice";
import { Icon } from "@iconify/react";

const CurrentUserComponent = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (!user) return null; // ถ้า user ไม่มี (ยังไม่ login) ก็ไม่ต้องแสดง component

  return (
    <div className="w-full h-20 px-4 py-2 flex items-center justify-between bg-[#026DB5]/30">
      {/* Left: User Info */}
      <div className="flex items-center space-x-3">
        <img
          src={`https://ui-avatars.com/api/?name=${user.name}&background=1e3a8a&color=fff`}
          alt="User Avatar"
          className="w-10 h-10 rounded-full"
        />
        <div className="text-white text-sm">
          <div className="font-semibold">{user.name}</div>
          <div className="text-blue-300 text-xs">{user.role}</div>
        </div>
      </div>

      {/* Right: Logout */}
      <button
        className="text-blue-300 cursor-pointer hover:text-white transition"
        onClick={handleLogout}
        title="Logout"
      >
        <Icon icon="ic:round-logout" width="24" height="24" />
      </button>
    </div>
  );
};

export default CurrentUserComponent;
