export interface Attachment {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  createdAt?: string;
}

export interface Task {
  _id?: string;
  titleName: string;
  companyName: string;
  companyPrefix: string;
  poNumber?: string;
  qtNumber?: string;
  sale: IUser; // user object
  description?: string;
  taskType: ("งานใหม่" | "งานแก้ไข" | "งานด่วน" | "งานเสีย")[];
  customTags?: string[];
  attachments: Attachment[]; // array ของไฟล์
  material?: string;
  quantity?: number;
  productUnit?: number;
  dueDate?: Date;
  isApprove: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface IUser {
  _id?: string;
  id?: string;
  isAdmin?: boolean;
  role?: string;
  username?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string;
  categories?: string;
  email?: string;
  password?: string;
  profilePic?: string;
}
export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export interface UserState {
  sales: IUser[];
  users: IUser[];
  loading: boolean;
  error: string | null;
}
