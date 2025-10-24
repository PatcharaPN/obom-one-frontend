import type { MenuItem } from "../types/interface";

export const menuItems: MenuItem[] = [
  {
    key: "1",
    label: "หน้าหลัก",
    icon: "iconamoon:home",
    submenu: [
      {
        key: "home",
        label: "รายการคำขอ",
        icon: "quill:paper",
        path: "/home",
      },
      {
        key: "status-tracking",
        label: "เช็คสถานะ",
        icon: "mdi:list-status",
        path: "/status-tracking",
      },
    ],
  },
  {
    key: "2",
    label: "ติดตามสถานะงาน",
    icon: "iconamoon:delivery",
    submenu: [
      {
        key: "Overview",
        label: "งานทั้งหมด",
        icon: "ri:dashboard-line",
        path: "/Overview",
      },
    ],
  },
];
