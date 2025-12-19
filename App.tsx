import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Layout, Calendar as CalendarIcon, PieChart, Settings as SettingsIcon, 
  Plus, Search, Mic, CheckCircle2, Circle, Clock, Tag, MoreHorizontal,
  ChevronRight, ChevronDown, Trash2, Upload, Download, FileText, Image as ImageIcon,
  PlayCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StorageService } from './services/storage';
import { parseTaskWithAI } from './services/geminiService';
import FocusTimer from './components/FocusTimer';
import { Task, Settings, ViewMode, Priority, SubTask } from './types';

// --- Utility Components ---

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    1: 'bg-red-100 text-red-700 border-red-200',
    2: 'bg-orange-100 text-orange-700 border-orange-200',
    3: 'bg-blue-100 text-blue-700 border-blue-200',
    4: 'bg-stone-100 text-stone-600 border-stone-200',
  };
  const labels = {
    1: '重要且紧急',
    2: '重要不紧急',
    3: '紧急不重要',
    4: '闲杂事务',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[priority]}`}>
      {labels[priority]}
    </span>
  );
};

interface TaskCardProps {
  task: Task;
  isDetailMode: boolean;
  onEdit: (task: Task) => void;
  onFocus: (task: Task) => void;
  onToggleStatus: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  isDetailMode, 
  onEdit, 
  onFocus, 
  onToggleStatus 
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all border border-stone-100 cursor-move"
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggleStatus(task.id)}
          className={`mt-1 flex-shrink-0 ${task.status === 'done' ? 'text-morandi-sage' : 'text-stone-300 hover:text-stone-400'}`}
        >
          {task.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 
              onClick={() => onEdit(task)}
              className={`font-medium text-stone-700 truncate cursor-pointer hover:text-morandi-sageDark ${task.status === 'done' ? 'line-through text-stone-400' : ''}`}
            >
              {task.title}
            </h4>
            <button 
              onClick={() => onFocus(task)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-morandi-accent hover:bg-morandi-accent/10 rounded px-1.5 py-0.5 text-xs flex items-center gap-1"
              title="Start 5m Focus"
            >
              <PlayCircle size={12} /> 5m
            </button>
          </div>

          {isDetailMode && (
            <div className="mt-2 space-y-2">
              {/* Meta info */}
              <div className="flex flex-wrap gap-2 text-xs text-stone-500">
                {task.deadline && (
                  <span className={`flex items-center gap-1 ${new Date(task.deadline) < new Date() ? 'text-red-500' : ''}`}>
                    <Clock size={12} />
                    {new Date(task.deadline).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-stone-50 px-1.5 rounded">
                  <Tag size={12} /> {task.category}
                </span>
              </div>

              {/* Subtasks progress */}
              {task.subTasks.length > 0 && (
                <div className="w-full bg-stone-100 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-morandi-sage h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(task.subTasks.filter(st => st.completed).length / task.subTasks.length) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  // Global State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<Settings>(StorageService.getSettings());
  const [categories, setCategories] = useState<string[]>(StorageService.getCategories());
  const [currentView, setCurrentView] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [isRecording, setIsRecording] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null); // For 5m timer

  // --- Effects ---

  useEffect(() => {
    setTasks(StorageService.getTasks());
  }, []);

  useEffect(() => {
    StorageService.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    StorageService.saveSettings(settings);
  }, [settings]);

  // Brain Clock Reminder
  useEffect(() => {
    if (settings.brainClockInterval <= 0) return;
    const interval = setInterval(() => {
      const overdueTasks = tasks.filter(t => t.deadline && new Date(t.deadline).getTime() < Date.now() && t.status !== 'done');
      if (overdueTasks.length > 0) {
        // Soft browser notification simulation
        console.log("Brain Clock: You have overdue tasks!");
        // In a real app, use Notification API here
      }
    }, settings.brainClockInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks, settings.brainClockInterval]);

  // --- Actions ---

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
    setShowTaskModal(false);
  };

  const updateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
    setShowTaskModal(false);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingTask?.id === id) {
      setEditingTask(null);
      setShowTaskModal(false);
    }
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      return t;
    }));
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      
      if (!settings.aiApiKey) {
        alert("Please set your AI API Key in Settings to use Voice Intelligence.");
        // Fallback: Open modal with text pre-filled (simplified here)
        return;
      }

      try {
        const parsed = await parseTaskWithAI(transcript, settings.aiApiKey);
        if (parsed) {
          const newTask: Task = {
            id: Date.now().toString(),
            title: parsed.title || transcript,
            category: parsed.category || '杂项',
            priority: parsed.priority || 2,
            deadline: parsed.deadline,
            repeat: 'none',
            subTasks: [],
            note: parsed.note || '',
            attachments: [],
            status: 'todo',
            createdAt: Date.now()
          };
          addTask(newTask);
        }
      } catch (e) {
        alert("AI Parsing failed. Check API Key.");
      }
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  // --- Sub-Components for Views ---

  const KanbanBoard = () => {
    const quadrants = [
      { p: 1, title: '重要且紧急', bg: 'bg-red-50/50' },
      { p: 2, title: '重要不紧急', bg: 'bg-orange-50/50' },
      { p: 3, title: '紧急不重要', bg: 'bg-blue-50/50' },
      { p: 4, title: '不重要不紧急', bg: 'bg-stone-50/50' },
    ];

    const onDrop = (e: React.DragEvent, newPriority: number) => {
      const taskId = e.dataTransfer.getData("taskId");
      const task = tasks.find(t => t.id === taskId);
      if (task && task.priority !== newPriority) {
        updateTask({ ...task, priority: newPriority as Priority });
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
        {quadrants.map(q => (
          <div 
            key={q.p} 
            className={`rounded-2xl p-4 ${q.bg} border border-stone-200/50 flex flex-col h-[45vh] md:h-auto overflow-hidden`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, q.p)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-stone-600">{q.title}</h3>
              <span className="text-xs bg-white px-2 py-1 rounded-full text-stone-400">
                {tasks.filter(t => t.priority === q.p && t.status !== 'done').length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {tasks.filter(t => t.priority === q.p && t.status !== 'done')
                .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isDetailMode={settings.isDetailMode}
                    onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                    onFocus={setFocusTask}
                    onToggleStatus={toggleTaskStatus}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const CalendarView = () => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    return (
      <div className="h-full bg-white rounded-2xl p-6 shadow-sm border border-stone-100 overflow-y-auto">
        <h2 className="text-xl font-bold text-stone-700 mb-6">{new Date().toLocaleString('zh-CN', { month: 'long', year: 'numeric' })}</h2>
        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-sm font-bold text-stone-400 uppercase">{d}</div>
          ))}
          {/* Simple placeholder for empty days if needed */}
          {days.map(day => {
            const dateStr = new Date(new Date().getFullYear(), new Date().getMonth(), day).toDateString();
            const dayTasks = tasks.filter(t => t.deadline && new Date(t.deadline).toDateString() === dateStr);
            
            return (
              <div key={day} className="min-h-[100px] border border-stone-100 rounded-xl p-2 hover:bg-stone-50 transition-colors relative">
                <span className="text-sm font-medium text-stone-400 block mb-1">{day}</span>
                <div className="space-y-1">
                  {dayTasks.map(t => (
                    <div key={t.id} className="text-[10px] bg-morandi-sage/20 text-morandi-sageDark px-1 py-0.5 rounded truncate">
                      {t.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SettingsPanel = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const success = StorageService.importData(ev.target.result as string);
          if (success) {
            setTasks(StorageService.getTasks());
            setSettings(StorageService.getSettings());
            setCategories(StorageService.getCategories());
            alert('Import Successful!');
          } else {
            alert('Invalid Data File');
          }
        }
      };
      reader.readAsText(file);
    };

    const handleExport = () => {
      const dataStr = StorageService.exportData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `focusflow-backup-${new Date().toISOString()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    };

    return (
      <div className="max-w-3xl mx-auto space-y-8 p-4">
        <h2 className="text-2xl font-bold text-stone-800">Settings</h2>
        
        <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-medium text-lg flex items-center gap-2"><SettingsIcon size={20} /> General</h3>
          <div className="flex items-center justify-between">
            <span>Detail Mode</span>
            <button 
              onClick={() => setSettings(s => ({...s, isDetailMode: !s.isDetailMode}))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.isDetailMode ? 'bg-morandi-sage' : 'bg-stone-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.isDetailMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brain Clock Interval (min)</label>
            <input 
              type="number" 
              value={settings.brainClockInterval}
              onChange={(e) => setSettings(s => ({...s, brainClockInterval: parseInt(e.target.value)}))}
              className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-morandi-sage"
            />
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-medium text-lg flex items-center gap-2"><Mic size={20} /> AI Integration</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Google Gemini API Key</label>
            <input 
              type="password" 
              value={settings.aiApiKey}
              onChange={(e) => setSettings(s => ({...s, aiApiKey: e.target.value}))}
              placeholder="Enter your API Key here..."
              className="w-full p-2 border border-stone-200 rounded-lg focus:outline-none focus:border-morandi-sage font-mono text-sm"
            />
            <p className="text-xs text-stone-400 mt-1">Stored locally. Used for Voice-to-Task features.</p>
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-medium text-lg flex items-center gap-2"><Download size={20} /> Data Management</h3>
          <div className="flex gap-4">
            <button onClick={handleExport} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium transition-colors">
              Export JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 font-medium transition-colors">
              Import JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
          </div>
        </section>
      </div>
    );
  };

  const TaskEditModal = () => {
    if (!showTaskModal) return null;
    
    // Local state for the form
    const [localTask, setLocalTask] = useState<Partial<Task>>(editingTask || {
      title: '',
      category: categories[0],
      priority: 2,
      subTasks: [],
      note: '',
      status: 'todo'
    });

    const handleSave = () => {
      if (!localTask.title) return;
      
      const fullTask: Task = {
        ...(editingTask || {
          id: Date.now().toString(),
          createdAt: Date.now(),
          repeat: 'none',
          attachments: [],
          status: 'todo'
        }),
        ...localTask as Task
      };

      if (editingTask) updateTask(fullTask);
      else addTask(fullTask);
    };

    const addSubTask = () => {
      const newSub: SubTask = { id: Date.now().toString(), text: '', completed: false };
      setLocalTask(prev => ({ ...prev, subTasks: [...(prev.subTasks || []), newSub] }));
    };

    const updateSubTask = (id: string, text: string) => {
      setLocalTask(prev => ({
        ...prev,
        subTasks: prev.subTasks?.map(s => s.id === id ? { ...s, text } : s)
      }));
    };

    return (
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
            <h3 className="font-bold text-lg text-stone-700">{editingTask ? 'Edit Task' : 'New Task'}</h3>
            <button onClick={() => setShowTaskModal(false)} className="p-2 hover:bg-stone-200 rounded-full">
              <CheckCircle2 size={20} className="opacity-0" /> {/* Spacer */}
              <div className="text-stone-500">Close</div>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <input 
              value={localTask.title}
              onChange={(e) => setLocalTask(t => ({ ...t, title: e.target.value }))}
              placeholder="What needs to be done?"
              className="w-full text-2xl font-bold placeholder-stone-300 border-none focus:outline-none focus:ring-0 bg-transparent"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Priority</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      onClick={() => setLocalTask(t => ({...t, priority: p as Priority}))}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-all
                        ${localTask.priority === p ? 'border-morandi-sage bg-morandi-sage text-white' : 'border-stone-200 text-stone-400 hover:border-stone-300'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Category</label>
                <select 
                  value={localTask.category}
                  onChange={(e) => setLocalTask(t => ({...t, category: e.target.value}))}
                  className="w-full p-2 bg-stone-50 rounded-lg border-none focus:ring-1 focus:ring-morandi-sage"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase mb-1">Deadline</label>
              <input 
                type="date" 
                value={localTask.deadline ? localTask.deadline.split('T')[0] : ''}
                onChange={(e) => setLocalTask(t => ({...t, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined}))}
                className="p-2 bg-stone-50 rounded-lg w-full"
              />
            </div>

            {/* One-Level Subtasks */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-stone-400 uppercase">Subtasks</label>
                <button onClick={addSubTask} className="text-morandi-sage hover:text-morandi-sageDark text-xs font-bold flex items-center gap-1">
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {localTask.subTasks?.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={sub.completed}
                      onChange={() => setLocalTask(t => ({
                        ...t, 
                        subTasks: t.subTasks?.map(s => s.id === sub.id ? {...s, completed: !s.completed} : s)
                      }))}
                      className="rounded text-morandi-sage focus:ring-morandi-sage"
                    />
                    <input 
                      value={sub.text}
                      onChange={(e) => updateSubTask(sub.id, e.target.value)}
                      placeholder="Subtask..."
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-morandi-sage focus:outline-none px-1 py-0.5"
                    />
                    <button 
                      onClick={() => setLocalTask(t => ({...t, subTasks: t.subTasks?.filter(s => s.id !== sub.id)}))}
                      className="text-stone-300 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Markdown Note */}
            <div className="h-40 flex flex-col">
              <label className="text-xs font-bold text-stone-400 uppercase mb-1">Notes (Markdown Supported)</label>
              <div className="flex-1 grid grid-cols-2 gap-4 h-full">
                <textarea 
                  value={localTask.note}
                  onChange={(e) => setLocalTask(t => ({...t, note: e.target.value}))}
                  placeholder="Type notes here... # Heading"
                  className="p-3 bg-stone-50 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-morandi-sage"
                />
                <div className="p-3 bg-white border border-stone-100 rounded-lg overflow-y-auto prose prose-sm prose-stone">
                  <ReactMarkdown>{localTask.note || '*Preview...*'}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-100 flex justify-between bg-stone-50">
            {editingTask ? (
              <button 
                onClick={() => deleteTask(editingTask.id)}
                className="text-red-400 hover:text-red-600 px-4 py-2 flex items-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button onClick={() => setShowTaskModal(false)} className="px-6 py-2 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-morandi-sage text-white font-medium hover:bg-morandi-sageDark transition-colors shadow-sm shadow-morandi-sage/30">
                Save Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const X = ({size}: {size:number}) => ( // Helper icon
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  );

  // --- Layout Render ---

  return (
    <div className="flex h-screen bg-morandi-base font-sans overflow-hidden text-stone-700">
      
      {/* Sidebar */}
      <aside className="w-64 bg-morandi-surface border-r border-stone-200/60 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-morandi-sage rounded-lg shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight text-stone-800">FocusFlow</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <button onClick={() => setCurrentView('kanban')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'kanban' ? 'bg-white shadow-sm text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-200/50'}`}>
            <Layout size={20} /> Dashboard
          </button>
          <button onClick={() => setCurrentView('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'calendar' ? 'bg-white shadow-sm text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-200/50'}`}>
            <CalendarIcon size={20} /> Calendar
          </button>
          <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-white shadow-sm text-stone-800 font-medium' : 'text-stone-500 hover:bg-stone-200/50'}`}>
            <SettingsIcon size={20} /> Settings
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-stone-200/50">
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
            <div className="w-10 h-10 bg-morandi-clay rounded-full flex items-center justify-center text-white font-bold">
              {settings.userName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{settings.userName}</p>
              <p className="text-xs text-stone-400">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-stone-200/30 bg-morandi-base/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative group w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-morandi-sage transition-colors" size={20} />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, tags, or notes..." 
                className="w-full bg-white/60 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-morandi-sage/50 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleVoiceInput}
              disabled={isRecording}
              className={`p-3 rounded-full transition-all shadow-sm ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-stone-600 hover:text-morandi-sage'}`}
              title="AI Voice Input"
            >
              <Mic size={20} />
            </button>
            <button 
              onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
              className="bg-stone-800 text-white px-5 py-3 rounded-full font-medium shadow-lg shadow-stone-400/50 hover:bg-stone-900 transition-transform active:scale-95 flex items-center gap-2"
            >
              <Plus size={20} /> <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden p-6 relative">
          {currentView === 'kanban' && <KanbanBoard />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'settings' && <SettingsPanel />}
        </div>
      </main>

      {/* Modals & Overlays */}
      <TaskEditModal />
      <FocusTimer 
        isOpen={!!focusTask} 
        onClose={() => setFocusTask(null)} 
        taskTitle={focusTask?.title || ''} 
      />
    </div>
  );
};

export default App;