export type Priority = 1 | 2 | 3 | 4; // 1: Urgent&Important, 2: Important, 3: Urgent, 4: Neither

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  content: string; // Base64
}

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  deadline?: string; // ISO Date string
  repeat: RepeatType;
  subTasks: SubTask[];
  note: string;
  attachments: Attachment[];
  status: TaskStatus;
  createdAt: number;
}

export interface Settings {
  themeColor: string;
  isDetailMode: boolean;
  aiApiKey: string;
  brainClockInterval: number; // in minutes
  userName: string;
}

export type ViewMode = 'kanban' | 'calendar' | 'list' | 'settings' | 'stats';
