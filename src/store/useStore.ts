import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@udharo_prefs';

export interface AppPrefs {
  language?: string;
  sortOrder?: 'recent' | 'balance';
}

interface AppState {
  isDbReady: boolean;
  setDbReady: (v: boolean) => void;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  prefs: AppPrefs;
  setPrefs: (p: Partial<AppPrefs>) => void;
  hydratePrefs: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isDbReady: false,
  setDbReady: (v) => set({ isDbReady: v }),
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  prefs: {},
  setPrefs: (p) => {
    const next = { ...get().prefs, ...p };
    set({ prefs: next });
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  },
  hydratePrefs: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as AppPrefs;
        set({ prefs });
      }
    } catch {
      // ignore
    }
  },
}));
