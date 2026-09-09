import { create } from "zustand";
import { AppSettings } from "../types/settings.types";
import { settingsRepository } from "../repositories/settings.repository";

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await settingsRepository.getSettings();
      set({ settings: data, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch settings", error);
      set({ isLoading: false });
    }
  },
  updateSettings: async (newSettings: Partial<AppSettings>) => {
    try {
      await settingsRepository.updateSettings(newSettings);
      const current = get().settings;
      if (current) {
        set({ settings: { ...current, ...newSettings, tax: { ...current.tax, ...newSettings.tax } } as AppSettings });
      } else {
        await get().fetchSettings();
      }
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  }
}));
