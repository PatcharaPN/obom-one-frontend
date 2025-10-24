export interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  activeItem: string;
  onSelectItem: (item: string) => void;
}

export interface SectionLayoutProps {
  title: string;
  subTitle?: string;
  menuItems?: { key: string; icon: string; path: string; label: string }[];
  activeItem: string;
  onSelectItem: (key: string) => void;
  path?: string;
  //   children: React.ReactNode;
}

export interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
  disabled?: boolean;
}

export interface UserListProp {
  userName: string;
  userPic: string;
}
export type MenuItem = {
  key: string;
  label: string;
  icon: string;
  path?: string; // <-- ใส่ ? ให้เป็น optional
  submenu?: MenuItem[];
};
