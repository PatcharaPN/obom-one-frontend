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
  sale: IUser;
  description?: string;
  taskType: ("งานใหม่" | "งานแก้ไข" | "งานด่วน" | "งานเสีย")[];
  customTags?: string[];
  attachments: Attachment[];
  material?: string;
  quantity?: number;
  productUnit?: number;
  tasks: SubTask[];
  dueDate?: Date;
  isApprove: boolean;
  approveDate: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface SubTask {
  name: string;
  material: string;
  quantity: number;
  attachments: string[];
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
  currentTask: Task | null;
  tasks: Task[];
  loading: boolean;
  summaryTasks: Task[];
  error: string | null;
}

export interface UserState {
  sales: IUser[];
  users: IUser[];
  loading: boolean;
  error: string | null;
}
