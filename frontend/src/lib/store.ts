import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  hydrated: boolean;
  setUser: (user: User | null) => void;
  setTasks: (tasks: Task[]) => void;
  setCurrentAgent: (agent: string | null) => void;
  logout: () => void;
  login: (user: User) => void;
  setChatOpen: (open: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      tasks: [],
      currentAgent: null,
      isLoggedIn: false,
      chatOpen: false,
      hydrated: false,
      setUser: (user) => set({ user, isLoggedIn: !!user }),
      setTasks: (tasks) => set({ tasks }),
      setCurrentAgent: (agent) => set({ currentAgent: agent }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, isLoggedIn: false, currentAgent: null, chatOpen: false });
      },
      login: (user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', user.token);
        }
        set({ user, isLoggedIn: true });
      },
      setChatOpen: (open) => set({ chatOpen: open }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'agentwork-auth',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        // 兼容旧版本地存储：将 legacy token/user 迁移到 persist 存储
        if (!state?.user && typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              state?.login({ ...user, token });
            } catch {
              // ignore malformed legacy data
            }
          }
        }
      },
    }
  )
);

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  // Prefer store state after hydration; fallback to legacy localStorage key
  const user = useStore.getState().user;
  if (user?.token) return user.token;
  return localStorage.getItem('token');
};
