import { Task, Settings } from '../types';

const TASKS_KEY = 'focusflow_tasks';
const SETTINGS_KEY = 'focusflow_settings';
const CATEGORIES_KEY = 'focusflow_categories';

const DEFAULT_CATEGORIES = ['学习', '技能', '运动', '职务'];
const DEFAULT_SETTINGS: Settings = {
  themeColor: 'sage',
  isDetailMode: true,
  brainClockInterval: 30,
  userName: 'User',
  
  // AI Defaults
  aiProvider: 'gemini',
  aiApiKey: '',
  aiBaseUrl: 'https://api.openai.com/v1',
  aiModel: 'gemini-2.5-flash-latest'
};

// Initial Sample Data
const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: '完成 React 项目架构设计',
    category: '职务',
    priority: 1,
    deadline: new Date(Date.now() + 86400000).toISOString(),
    repeat: 'none',
    subTasks: [
      { id: 's1', text: '定义 TypeScript 接口', completed: true },
      { id: 's2', text: '配置 Tailwind CSS', completed: false }
    ],
    note: '# 设计文档\n- 需要包含组件图\n- 数据流定义',
    attachments: [],
    status: 'in-progress',
    createdAt: Date.now()
  },
  {
    id: '2',
    title: '阅读《深度工作》',
    category: '学习',
    priority: 2,
    repeat: 'daily',
    subTasks: [],
    note: '每天阅读 30 分钟',
    attachments: [],
    status: 'todo',
    createdAt: Date.now()
  },
  {
    id: '3',
    title: '回复客户邮件',
    category: '职务',
    priority: 3,
    deadline: new Date(Date.now() - 3600000).toISOString(), // Overdue
    repeat: 'none',
    subTasks: [],
    note: '',
    attachments: [],
    status: 'todo',
    createdAt: Date.now()
  },
  {
    id: '4',
    title: '整理桌面',
    category: '生活',
    priority: 4,
    repeat: 'weekly',
    subTasks: [],
    note: '',
    attachments: [],
    status: 'done',
    createdAt: Date.now()
  }
];

export const StorageService = {
  getTasks: (): Task[] => {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : SAMPLE_TASKS;
  },

  saveTasks: (tasks: Task[]) => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  },

  getSettings: (): Settings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    const settings = data ? JSON.parse(data) : DEFAULT_SETTINGS;
    // Merge with defaults to ensure new fields exist for old users
    return { ...DEFAULT_SETTINGS, ...settings };
  },

  saveSettings: (settings: Settings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getCategories: (): string[] => {
    const data = localStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
  },

  saveCategories: (categories: string[]) => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  },

  exportData: () => {
    const data = {
      tasks: StorageService.getTasks(),
      settings: StorageService.getSettings(),
      categories: StorageService.getCategories(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) StorageService.saveTasks(data.tasks);
      if (data.settings) StorageService.saveSettings(data.settings);
      if (data.categories) StorageService.saveCategories(data.categories);
      return true;
    } catch (e) {
      console.error("Import failed", e);
      return false;
    }
  }
};
