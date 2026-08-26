import { create } from 'zustand';

interface User {
  id: string;
  phone: string;
  realName: string;
  companyName?: string;
  skills: string[];
  creditScore: number;
  level: number;
  accountType?: 'individual' | 'enterprise';
  token: string;
}

interface Task {
  id: string;
  title: string;
  type: string;
  description: string;
  reward: number;
  currency: string;
  deadline: string;
  requiredSkills: string[];
  status: string;
  region: string;
}

interface StoreState {
  user: User | null;
  tasks: Task[];
  currentAgent: string | null;
  isLoggedIn: boolean;
  chatOpen: boolean;
  setUser: (user: User | null) => void;
  setTasks: (tasks: Task[]) => void;
  setCurrentAgent: (agent: string | null) => void;
  logout: () => void;
  login: (user: User) => void;
  setChatOpen: (open: boolean) => void;
}

// 从 localStorage 恢复用户数据
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;
    const user = JSON.parse(userStr);
    return { ...user, token };
  } catch {
    return null;
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const storedUser = typeof window !== 'undefined' ? getStoredUser() : null;

export const useStore = create<StoreState>((set) => ({
  user: storedUser,
  tasks: [],
  currentAgent: null,
  isLoggedIn: !!storedUser,
  chatOpen: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setTasks: (tasks) => set({ tasks }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setChatOpen: (open) => set({ chatOpen: open }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isLoggedIn: false, currentAgent: null, chatOpen: false });
  },
  login: (user) => {
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },
}));
