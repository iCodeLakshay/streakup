import { create } from 'zustand';

interface UIStore {
  addHabitOpen: boolean;
  openAddHabit: () => void;
  closeAddHabit: () => void;
}

export const useUIStore = create<UIStore>(set => ({
  addHabitOpen: false,
  openAddHabit: () => set({ addHabitOpen: true }),
  closeAddHabit: () => set({ addHabitOpen: false }),
}));
