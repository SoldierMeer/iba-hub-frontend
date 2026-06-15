import { create } from 'zustand';

interface AppState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  userProfile: any | null;
  setUserProfile: (profile: any) => void;
}

export const useStore = create<AppState>((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
}));