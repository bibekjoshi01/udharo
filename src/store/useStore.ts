import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@udharo_prefs';

export interface AppPrefs {
  language?: string;
  sortOrder?: 'recent' | 'balance';
  lockEnabled?: boolean;
  pin?: string;
  biometricEnabled?: boolean;
  lockDelayMs?: number;
}

interface AppState {
  isDbReady: boolean;
  setDbReady: (v: boolean) => void;
  isUnlocked: boolean;
  setUnlocked: (v: boolean) => void;
  prefsHydrated: boolean;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  prefs: AppPrefs;
  setPrefs: (p: Partial<AppPrefs>) => void;
  lastBackgroundAt: number | null;
  setLastBackgroundAt: (v: number | null) => void;
  hydratePrefs: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isDbReady: false,
  setDbReady: (v) => set({ isDbReady: v }),
  isUnlocked: true,
  setUnlocked: (v) => set({ isUnlocked: v }),
  prefsHydrated: false,
  selectedCustomerId: null,
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  prefs: {},
  setPrefs: (p) => {
    const next = { ...get().prefs, ...p };
    set({ prefs: next });
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  },
  lastBackgroundAt: null,
  setLastBackgroundAt: (v) => set({ lastBackgroundAt: v }),
  hydratePrefs: async () => {
    if (get().prefsHydrated) return;
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      if (raw) {
        const prefs = JSON.parse(raw) as AppPrefs;
        set({
          prefs,
          prefsHydrated: true,
          isUnlocked: prefs.lockEnabled ? false : get().isUnlocked,
        });
        return;
      }
      set({ prefsHydrated: true });
    } catch {
      // ignore
    }
  },
}));
